"""
Rule-Based PII Detection Engine.

This module provides regex-based detection for various types of
Personally Identifiable Information (PII) in sample data.

Supported PII Types:
    - Email addresses
    - Phone numbers (US and Indian formats)
    - Credit card numbers
    - Social Security Numbers (SSN)
    - Aadhaar numbers (Indian)
    - PAN numbers (Indian)

No ML. No external services. Fully deterministic and safe.
"""

import re
from typing import List, Dict, Any


# Regex patterns for PII detection
PII_PATTERNS = {
    'email': re.compile(
        r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}',
        re.IGNORECASE
    ),
    'phone': re.compile(
        # Indian mobile: starts with 6-9, followed by 9 digits
        r'\b[6-9]\d{9}\b|'
        # Indian with country code
        r'\+91[-.\s]?[6-9]\d{9}\b|'
        # US format: (XXX) XXX-XXXX or XXX-XXX-XXXX
        r'\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b'
    ),
    'card': re.compile(
        r'\b(?:4[0-9]{12}(?:[0-9]{3})?|'  # Visa
        r'5[1-5][0-9]{14}|'               # MasterCard
        r'3[47][0-9]{13}|'                # American Express
        r'6(?:011|5[0-9]{2})[0-9]{12})\b' # Discover
    ),
    'ssn': re.compile(
        r'\b\d{3}[-.\s]?\d{2}[-.\s]?\d{4}\b'
    ),
    'aadhaar': re.compile(
        # Aadhaar: 12 digits, optionally separated by spaces/dashes
        # First digit is 2-9 (not 0 or 1)
        r'\b[2-9]\d{3}[-\s]?\d{4}[-\s]?\d{4}\b'
    ),
    'pan': re.compile(
        # PAN format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
        r'\b[A-Z]{5}[0-9]{4}[A-Z]\b',
        re.IGNORECASE
    ),
}

# Confidence scores for each PII type
CONFIDENCE_SCORES = {
    'email': 0.95,
    'phone': 0.90,
    'card': 0.92,
    'ssn': 0.93,
    'aadhaar': 0.94,
    'pan': 0.94,
    'default': 0.70,
}


def detect_pii_in_value(value: Any) -> List[str]:
    """
    Detect PII types present in a single value.
    
    Args:
        value: A single data value to check for PII
        
    Returns:
        List of detected PII types (e.g., ['email', 'phone'])
    """
    if value is None:
        return []
    
    str_value = str(value)
    detected_types = []
    
    for pii_type, pattern in PII_PATTERNS.items():
        if pattern.search(str_value):
            detected_types.append(pii_type)
    
    return detected_types


def detect_pii_from_sample_data(sample_tables: List[Dict]) -> List[Dict]:
    """
    Detect PII fields from sample table data.
    
    This function analyzes sample data from multiple tables and identifies
    fields that contain potential PII based on regex pattern matching.
    
    Args:
        sample_tables: List of table dictionaries with structure:
            [
                {
                    "table_name": "users",
                    "fields": [
                        {
                            "field_name": "email",
                            "sample_values": ["user@example.com", "test@test.com"]
                        },
                        ...
                    ]
                },
                ...
            ]
    
    Returns:
        List of detected PII field dictionaries:
            [
                {
                    "table_name": "users",
                    "field_name": "email",
                    "pii_type": "email",
                    "confidence": 0.95
                },
                ...
            ]
    """
    detected_fields = []
    
    for table in sample_tables:
        table_name = table.get('table_name', '')
        fields = table.get('fields', [])
        
        for field in fields:
            field_name = field.get('field_name', '')
            sample_values = field.get('sample_values', [])
            
            # Track which PII types are detected and their occurrence count
            pii_type_counts = {}
            total_values = len(sample_values)
            
            for value in sample_values:
                detected_types = detect_pii_in_value(value)
                for pii_type in detected_types:
                    pii_type_counts[pii_type] = pii_type_counts.get(pii_type, 0) + 1
            
            # If a PII type is detected in more than 50% of non-empty values,
            # consider the field as containing that PII type
            for pii_type, count in pii_type_counts.items():
                if total_values > 0 and count / total_values >= 0.5:
                    confidence = CONFIDENCE_SCORES.get(
                        pii_type, 
                        CONFIDENCE_SCORES['default']
                    )
                    
                    detected_fields.append({
                        'table_name': table_name,
                        'field_name': field_name,
                        'pii_type': pii_type,
                        'confidence': confidence,
                    })
    
    return detected_fields


def get_simulated_table_metadata() -> List[Dict]:
    """
    Generate simulated table metadata for demo/testing purposes.
    
    This function returns sample table structures with mock data
    that includes various PII types for testing the detection engine.
    
    Returns:
        List of simulated table dictionaries with sample data
    """
    return [
        {
            'table_name': 'users',
            'fields': [
                {
                    'field_name': 'id',
                    'sample_values': ['1', '2', '3', '4', '5']
                },
                {
                    'field_name': 'email',
                    'sample_values': [
                        'john.doe@example.com',
                        'jane.smith@company.org',
                        'admin@website.net',
                        'user123@test.co',
                        'contact@business.com'
                    ]
                },
                {
                    'field_name': 'phone_number',
                    'sample_values': [
                        '555-123-4567',
                        '(555) 987-6543',
                        '+1 555 456 7890',
                        '555.321.9876',
                        '5551234567'
                    ]
                },
                {
                    'field_name': 'username',
                    'sample_values': ['johnd', 'janes', 'admin', 'user123', 'contact']
                },
            ]
        },
        {
            'table_name': 'payments',
            'fields': [
                {
                    'field_name': 'id',
                    'sample_values': ['101', '102', '103', '104', '105']
                },
                {
                    'field_name': 'card_number',
                    'sample_values': [
                        '4111111111111111',
                        '5500000000000004',
                        '340000000000009',
                        '6011000000000004',
                        '4012888888881881'
                    ]
                },
                {
                    'field_name': 'amount',
                    'sample_values': ['99.99', '150.00', '25.50', '1000.00', '75.25']
                },
                {
                    'field_name': 'transaction_date',
                    'sample_values': [
                        '2024-01-15',
                        '2024-02-20',
                        '2024-03-10',
                        '2024-04-05',
                        '2024-05-01'
                    ]
                },
            ]
        },
        {
            'table_name': 'employees',
            'fields': [
                {
                    'field_name': 'id',
                    'sample_values': ['E001', 'E002', 'E003', 'E004', 'E005']
                },
                {
                    'field_name': 'ssn',
                    'sample_values': [
                        '123-45-6789',
                        '987-65-4321',
                        '456-78-9012',
                        '321-54-9876',
                        '654-32-1098'
                    ]
                },
                {
                    'field_name': 'hire_date',
                    'sample_values': [
                        '2020-01-15',
                        '2019-06-01',
                        '2021-03-22',
                        '2018-11-10',
                        '2022-07-05'
                    ]
                },
                {
                    'field_name': 'department',
                    'sample_values': ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance']
                },
            ]
        },
        {
            'table_name': 'customers',
            'fields': [
                {
                    'field_name': 'customer_id',
                    'sample_values': ['C1001', 'C1002', 'C1003', 'C1004', 'C1005']
                },
                {
                    'field_name': 'contact_email',
                    'sample_values': [
                        'customer1@gmail.com',
                        'buyer2@yahoo.com',
                        'client3@outlook.com',
                        'shopper4@hotmail.com',
                        'member5@aol.com'
                    ]
                },
                {
                    'field_name': 'contact_phone',
                    'sample_values': [
                        '(800) 555-0100',
                        '800-555-0101',
                        '+1-800-555-0102',
                        '800.555.0103',
                        '8005550104'
                    ]
                },
                {
                    'field_name': 'loyalty_points',
                    'sample_values': ['1500', '2300', '890', '4500', '3200']
                },
            ]
        },
    ]
