from odoo import models, api, _
from odoo.exceptions import ValidationError


class ProductCategory(models.Model):
    _inherit = 'product.category'

    @api.constrains('name')
    def check_unique_name(self):
        """
        :return: Display the validation error if entered existing name.
        """
        for record in self:
            duplicate_record = self.search([('name', '=', record.name), ('id', '!=', record.id)])
            if record.name == duplicate_record.name:
                raise ValidationError(_("The category name should be unique"))




