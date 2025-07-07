from odoo import fields, models


class StockPicking(models.Model):
    _inherit = 'stock.picking'

    sale_tag_ids = fields.Many2many(
        'crm.tag', string="Sale Tags"
    )

    def notify_salesperson_by_email(self):
        """
        When delivery is completed, the system send the email to the corresponding salesperson.
        :return: Notify email to the salesperson
        """
        for picking in self:
            if picking.state == 'done':
                delivery_mail_template = self.env.ref(
                    'bizz_app_dev_assignment.mail_template_delivery_done_notify_salesperson',
                    raise_if_not_found=True)
                delivery_mail_template.send_mail(picking.id, force_send=True)
