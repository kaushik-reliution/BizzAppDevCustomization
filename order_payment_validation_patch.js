import { PosStore } from "@point_of_sale/app/services/pos_store";
import OrderPaymentValidation from "@point_of_sale/app/utils/order_payment_validation";
import { FeedbackScreen } from "@point_of_sale/app/screens/feedback_screen/feedback_screen";
import { patch } from "@web/core/utils/patch";

patch(OrderPaymentValidation.prototype, {
    get nextPage() {
        if (this.pos.config.restore_receipt_screen) {
            return !this.error
                ? {
                      page: "ReceiptScreen",
                      params: {
                          orderUuid: this.order.uuid,
                      },
                  }
                : this.pos.defaultPage;
        }
        return super.nextPage;
    },
    async shouldHideValidationBehindFeedbackScreen() {
        const nextPage = this.nextPage;
        if (this.pos.config.restore_receipt_screen && nextPage.page === "ReceiptScreen") {
            const waitForFn = async () => {
                await this.finalizeValidation();
            };
            nextPage.params.waitFor = waitForFn();
            this.pos.navigate(nextPage.page, nextPage.params);
            return;
        }
        return super.shouldHideValidationBehindFeedbackScreen(...arguments);
    },
});

patch(PosStore.prototype, {
    navigate(page, params) {
        if (this.config.restore_receipt_screen && page === "FeedbackScreen") {
            page = "ReceiptScreen";
        }
        return super.navigate(page, params);
    },
});

patch(FeedbackScreen.prototype, {
    setup() {
        super.setup();
        if (this.pos.config.restore_receipt_screen) {
            const orderUuid = this.props.orderUuid || this.pos?.getOrder()?.uuid;
            if (orderUuid) {
                this.pos.navigate("ReceiptScreen", { orderUuid, waitFor: this.props.waitFor });
            }
        }
    },
});
