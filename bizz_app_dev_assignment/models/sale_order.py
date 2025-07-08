# -*- coding: utf-8 -*-

from odoo import models, fields, api, _


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def _action_confirm(self):
        """
        Copied the tags from the sale order to delivery order.
        Split purchase orders by product category; 
        default behavior is used if vendors differ within a category.
        """
        res = super()._action_confirm()
        purchase_order_line = self.env['purchase.order.line']
        for order in self.filtered(lambda so: so.tag_ids):
            for picking in order.picking_ids.filtered(lambda pick: pick.picking_type_code == 'outgoing'):
                picking.sale_tag_ids = [(6, 0, order.tag_ids.ids)]

        for order in self:
            purchase_orders = order._get_purchase_orders()
            categorize_lines = {}
            for po in purchase_orders.filtered(lambda purchase: len(purchase.order_line) > 1):
                for line in po.order_line:
                    category_id = line.product_id.categ_id
                    categorize_lines[category_id.id] = [line]
                if len(categorize_lines) <= 1:
                    continue

                sorted_categories = sorted(categorize_lines.items())[-1]
                main_category, main_lines = sorted_categories
                categorize_lines.pop(main_category)

                for category, lines in categorize_lines.items():
                    new_po = po.copy(default={
                        'order_line': False,
                        'origin': f"{po.origin or ''}",
                    })

                    for line in lines:
                        order_line_vals = self.prepare_purchase_order_line_vals(line)
                        order_line_vals['order_id'] = new_po.id
                        purchase_order_line.create(order_line_vals)

                for existing_lines in categorize_lines.values():
                    for po_line in existing_lines:
                        po_line.unlink()
        return res

    def prepare_purchase_order_line_vals(self, line):
        return {
            'product_id': line.product_id.id,
            'name': line.name,
            'product_qty': line.product_qty,
            'product_uom': line.product_uom.id,
            'price_unit': line.price_unit,
            'date_planned': line.date_planned,
            'taxes_id': [(6, 0, line.taxes_id.ids)],
            'move_dest_ids': [(4, move.id) for move in line.move_dest_ids],
            'orderpoint_id': line.orderpoint_id.id,
            'propagate_cancel': line.propagate_cancel,
            'product_description_variants': line.product_description_variants,
        }
