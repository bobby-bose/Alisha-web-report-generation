"""
Logic module for ZC Exporter invoice processing
Handles dynamic table row generation and data transformation
"""

def calculate_middle_row(total_items):
    """
    Calculate the middle row index for displaying "AS ADDRESS"
    
    Formula: middle_row = (total_items // 2) + (total_items % 2)
    
    Examples:
    - 5 items: (5//2) + (5%2) = 2 + 1 = 3 (middle is 3rd row)
    - 6 items: (6//2) + (6%2) = 3 + 0 = 3 (middle is 3rd row)
    - 10 items: (10//2) + (10%2) = 5 + 0 = 5 (middle is 5th row)
    - 1 item: (1//2) + (1%2) = 0 + 1 = 1 (middle is 1st row)
    
    Args:
        total_items (int): Total number of items in the table
    
    Returns:
        int: The index of the middle row (1-indexed for Jinja2 compatibility)
    """
    if total_items <= 0:
        return 1
    
    middle_row = (total_items // 2) + (total_items % 2)
    return middle_row


def prepare_table_rows(items, taxable_value=None, igst_percent=None, igst_amount=None):
    """
    Prepare table rows with metadata for template rendering
    
    Adds middle_row information to each row for Jinja2 conditional rendering
    
    Args:
        items (list): List of row dictionaries from database
        taxable_value (str): Taxable value to display on middle row
        igst_percent (str): IGST percentage to display on middle row
        igst_amount (str): IGST amount to display on middle row
    
    Returns:
        dict: Dictionary containing:
            - 'rows': List of enriched row objects
            - 'middle_row': Index of the middle row (1-indexed)
            - 'total_items': Total number of items
            - 'taxable_value': Taxable value for middle row
            - 'igst_percent': IGST percent for middle row
            - 'igst_amount': IGST amount for middle row
    
    Example:
        items = [
            {'from': '1', 'to': '10', 'description': 'Item 1', 'quantity': '5'},
            {'from': '11', 'to': '20', 'description': 'Item 2', 'quantity': '3'},
            {'from': '21', 'to': '30', 'description': 'Item 3', 'quantity': '2'},
        ]
        result = prepare_table_rows(items, '1000.00', '5', '50.00')
    """
    
    if not items:
        items = []
    
    total_items = len(items)
    middle_row = calculate_middle_row(total_items)
    
    # Enrich each row with index information
    enriched_rows = []
    for index, row in enumerate(items, 1):
        enriched_row = dict(row)  # Create a copy of the row
        enriched_row['row_index'] = index
        enriched_row['is_middle_row'] = (index == middle_row)
        enriched_rows.append(enriched_row)
    
    return {
        'rows': enriched_rows,
        'middle_row': middle_row,
        'total_items': total_items,
        'taxable_value': taxable_value or '0.00',
        'igst_percent': igst_percent or '0.00',
        'igst_amount': igst_amount or '0.00'
    }


def prepare_invoice_data(record):
    """
    Prepare complete invoice data from database record
    
    Transforms database model into template-ready data dictionary
    including calculated row metadata for dynamic table generation
    
    Args:
        record (ZCExporter): Database record object
    
    Returns:
        dict: Complete data dictionary ready for template rendering
    """
    
    # Calculate middle row for table
    table_data = prepare_table_rows(
        items=record.items or [],
        taxable_value=getattr(record, 'taxable_value', None),
        igst_percent=getattr(record, 'igst_percent', None),
        igst_amount=getattr(record, 'igst_amount', None)
    )
    
    # Base invoice data
    data = {
        'invoiceNumber': record.invoice_number or '',
        'invoiceDate': record.invoice_date or '',
        'buyerOrderNumber': record.buyer_order_number or '',
        'buyerOrderDate': record.buyer_order_date or '',
        'exporterReference': record.exporter_reference or '',
        'iecNumber': record.iec_number or '',
        'taxRegistrationNumber': record.tax_registration_number or '',
        'lutArnNumber': record.lut_arn_number or '',
        'deliveryPaymentTerms': record.delivery_payment_terms or '',
        'portOfLoading': record.port_of_loading or '',
        'portOfDischarge': record.port_of_discharge or '',
        'preCarriageBy': record.pre_carriage_by or '',
        'placeOfReceipt': record.place_of_receipt or '',
        'portOfDestination': record.port_of_destination or '',
        'destination': record.destination or '',
        'currency': record.currency or 'INR',
        'vesselFlight': record.vessel_flight or '',
        'countryOfOrigin': record.country_of_origin or '',
        'adCode': record.ad_code or '',
        'otherReference': record.other_reference or '',
        'hsCode': record.hs_code or '',
        'finalDestination': record.final_destination or '',
        'contactPersonName': record.contact_person_name or '',
        'contactEmail': record.contact_email or '',
        'consigneeAddress': record.consignee_address or '',
        'deliveryAddress': record.delivery_address or '',
        'amountInWords': record.amount_in_words or '',
        'totalExportValue': record.total_export_value or '0.00',
        'totalGstValue': record.total_gst_value or '0.00',
        'totalInvoiceValue': record.total_invoice_value or '0.00',
        'numberOfBoxes': record.number_of_boxes or 0,
        'items': record.items or [],
        'tableRows': record.items or [],
        
        # Table metadata from prepare_table_rows
        'middle_row': table_data['middle_row'],
        'total_items': table_data['total_items'],
        'taxable_value': table_data['taxable_value'],
        'igst_percent': table_data['igst_percent'],
        'igst_amount': table_data['igst_amount']
    }
    
    return data
