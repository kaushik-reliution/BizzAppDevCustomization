import { _t } from "@web/core/l10n/translation";
import { useTrackedAsync } from "@point_of_sale/app/hooks/hooks";
import { registry } from "@web/core/registry";
import { Component, proxy, signal, onWillStart, onMounted, onPatched, useProps, t } from "@odoo/owl";
import { usePos } from "@point_of_sale/app/hooks/pos_hook";
import { useService } from "@web/core/utils/hooks";
import { ConfirmationDialog } from "@web/core/confirmation_dialog/confirmation_dialog";
import { isValidEmail } from "@point_of_sale/utils";
import { useRouterParamsChecker } from "@point_of_sale/app/hooks/pos_router_hook";
import { renderToElement } from "@web/core/utils/render";

export class ReceiptScreen extends Component {
    static template = "pos_restore_receipt_screen.ReceiptScreen";
    static components = {};
    props = useProps({
        orderUuid: t.string(),
        waitFor: t.object().optional(),
    });

    receiptContainerRef = signal.ref();

    setup() {
        super.setup();
        this.pos = usePos();
        useRouterParamsChecker(this.constructor.name);
        this.ui = useService("ui");
        this.notification = useService("notification");
        this.dialog = useService("dialog");

        const partner = this.currentOrder?.getPartner();
        const email = partner?.invoice_emails || partner?.email || "";
        this.state = proxy({
            email: email,
            phone: partner?.phone || "",
        });

        this.sendReceipt = useTrackedAsync(this._sendReceiptToCustomer.bind(this));
        this.doFullPrint = useTrackedAsync(() =>
            this.pos.ticketPrinter.printOrderReceipt({ order: this.currentOrder })
        );
        this.doBasicPrint = useTrackedAsync(() =>
            this.pos.ticketPrinter.printOrderReceipt({ order: this.currentOrder, basic: true })
        );

        onWillStart(() => this.waiter());
        onMounted(() => this.renderReceipt());
        onPatched(() => this.renderReceipt());
    }

    renderReceipt() {
        const container = this.receiptContainerRef();
        if (!container || !this.currentOrder) return;
        try {
            const receiptData = this.pos.ticketPrinter.getOrderReceiptData(this.currentOrder);
            const receiptEl = renderToElement("point_of_sale.pos_order_receipt", receiptData);
            container.innerHTML = "";
            container.appendChild(receiptEl);
        } catch (err) {
            console.error("Error rendering receipt template:", err);
        }
    }

    async waiter() {
        try {
            if (this.props.waitFor) {
                await this.props.waitFor;
            }
        } catch (e) {
            console.error(e);
        }
    }

    get currentOrder() {
        return this.pos.models["pos.order"].getBy("uuid", this.props.orderUuid);
    }

    get orderAmountPlusTip() {
        const order = this.currentOrder;
        if (!order) return "";
        const orderTotalAmount = order.priceIncl || order.amount_total || 0;
        const tip_product_id = this.pos.config.tip_product_id?.id;
        const tipLine = order
            .getOrderlines()
            ?.find((line) => tip_product_id && line.product_id?.id === tip_product_id);
        const tipAmount = tipLine ? (tipLine.prices?.total_included ?? tipLine.priceIncl ?? 0) : 0;
        const orderAmountStr = this.pos.formatCurrency(orderTotalAmount - tipAmount);
        if (!tipAmount) {
            return orderAmountStr;
        }
        const tipAmountStr = this.pos.formatCurrency(tipAmount);
        return `${orderAmountStr} + ${tipAmountStr} tip`;
    }

    get ticketScreen() {
        return { name: "TicketScreen" };
    }

    get isValidEmail() {
        return isValidEmail(this.state.email);
    }

    get isValidPhone() {
        return this.state.phone && /^\+?[()\d\s-.]{8,18}$/.test(this.state.phone);
    }

    showPhoneInput() {
        return Boolean(this.pos.config.module_pos_sms || this.state.phone);
    }

    actionSendReceiptOnEmail() {
        this.sendReceipt.call({
            action: "action_send_receipt",
            destination: this.state.email,
            name: "Email",
        });
    }

    actionSendReceiptOnPhone() {
        if (this.pos.config.module_pos_sms) {
            this.actionSendReceiptOnSMS();
        }
    }

    actionSendReceiptOnSMS() {
        this.sendReceipt.call({
            action: "action_sent_message_on_sms",
            destination: this.state.phone,
            name: "SMS",
        });
    }

    isContinueSplitting() {
        return Boolean(this.currentOrder?.uiState?.splittedOrderUuid);
    }

    continueSplitting() {
        const originalOrderUuid = this.currentOrder?.uiState?.splittedOrderUuid;
        if (originalOrderUuid && this.currentOrder?.uiState) {
            this.currentOrder.uiState.screen_data = { value: "" };
        }
        this.pos.navigate("PaymentScreen", { orderUuid: originalOrderUuid });
    }

    async _sendReceiptToCustomer({ action, destination }) {
        const order = this.currentOrder;
        if (!order) return;
        if (!order.isSynced) {
            this.dialog.add(ConfirmationDialog, {
                title: _t("Unsynced order"),
                body: _t(
                    "This order is not yet synced to server. Make sure it is synced then try again."
                ),
                showReloadButton: true,
            });
            return Promise.reject();
        }
        await this.pos.data.call("pos.order", action, [[order.id], destination]);
    }
}

registry.category("pos_pages").add("ReceiptScreen", {
    name: "ReceiptScreen",
    component: ReceiptScreen,
    route: `/pos/ui/${odoo.pos_config_id}/receipt/{string:orderUuid}`,
    params: {},
});
