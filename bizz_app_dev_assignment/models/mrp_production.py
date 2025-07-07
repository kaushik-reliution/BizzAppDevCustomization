from odoo import models, _
from odoo.exceptions import UserError


class MrpProduction(models.Model):
    _inherit = 'mrp.production'

    def write(self, vals):
        """
        :param vals: updated records
        :return: Display warning if try to change the qty on confirmed order.
        """
        if 'qty_producing' in vals:
            for mo in self:
                if mo.state == 'confirmed' and mo.move_dest_ids.filtered(lambda move: move.sale_line_id):
                    raise UserError(_(
                        "You can't change the quantity for confirmed order"))
        return super(MrpProduction, self).write(vals)
