# -*- coding: utf-8 -*-

{
    "name": "BizzAppDev Assignment ",
    "version": "17.0.2.0.0",
    "category": "Hidden",
    "summary": "",
    "description": """Kaushik Pathak""",
    "depends": ['contacts', 'sale_management', 'stock', 'mrp', 'base_automation'],
    "data": [
        'data/automation_rule.xml',
        'data/mail_template_delivery_done.xml',
        'views/stock_picking_views.xml',
        'views/sale_order_views.xml',
        'views/product_category_views.xml',
    ],
    "license": "AGPL-3",
    "installable": True,
    "auto_install": False,
    "application": False,
}
