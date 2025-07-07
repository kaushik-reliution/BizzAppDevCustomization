# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import UserError
from odoo.tools import DEFAULT_SERVER_DATETIME_FORMAT
from werkzeug import urls
import datetime
import uuid


class SaleOrder(models.Model):
    _inherit = 'sale.order'

    def _action_confirm(self):
        """
        Copied the tags from the sale order to delivery order.
        :return: True
        """
        res = super()._action_confirm()
        for order in self.filtered(lambda so: so.tag_ids):
            for picking in order.picking_ids.filtered(lambda pick: pick.picking_type_code == 'outgoing'):
                picking.sale_tag_ids = [(6, 0, order.tag_ids.ids)]
        return res
