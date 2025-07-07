# -*- coding: utf-8 -*-
from odoo import api, fields, models, _
from odoo.osv import expression


class ResPartner(models.Model):
    _inherit = 'res.partner'

    @api.depends('ref')
    def _compute_display_name(self):
        """
        :return: Display the combination of NAME[REF].
        """
        for record in self:
            if record.name:
                if record.ref:
                    record.display_name = f"{record.name} [{record.ref}]"
                else:
                    record.display_name = record.name
            else:
                super(ResPartner, record)._compute_display_name()

    @api.model
    def name_search(self, name='', args=None, operator='ilike', limit=100):
        """
        :return: Extend the searching based on name or reference.
        """
        domain = args or []
        records = self.search_fetch(expression.AND([domain, [('ref', operator, name)]]), ['display_name'], limit=limit)
        if records:
            return [(partner.id, partner.display_name) for partner in records]
        return super().name_search(name, args, operator, limit)
