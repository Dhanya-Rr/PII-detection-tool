"""
Masking Service for PII Anonymization.

This module provides masking strategies and the MaskingService class
for processing detected PII fields with various anonymization techniques.

Masking Strategies:
    - Email: d*****@gmail.com
    - Phone: *****7212
    - Name: d****
    - Address: *****et
    - Account Number: ****43
    - Credit Card: ****1234
    - SSN: ***-**-1234
    - Aadhaar: ****1234
    - PAN: ****1234
"""

import re
import time
import logging
from typing import Dict, List, Callable, Any, Generator
from datetime import datetime
from django.utils import timezone

logger = logging.getLogger(__name__)


# ============================================================================
# MASKING FUNCTIONS
# ============================================================================

def mask_email(value: str) -> str:
    """
    Mask email address keeping first char and domain visible.
    
    Example: dhanya@gmail.com → d*****@gmail.com
    """
    if not value or '@' not in value:
        return '*' * len(value) if value else ''
    
    try:
        local_part, domain = value.rsplit('@', 1)
        if len(local_part) <= 1:
            masked_local = local_part
        else:
            masked_local = local_part[0] + '*' * (len(local_part) - 1)
        return f"{masked_local}@{domain}"
    except Exception:
        return '*' * len(value)


def mask_phone(value: str) -> str:
    """
    Mask phone number keeping last 4 digits visible.
    
    Example: 9999872123 → ******2123
    """
    if not value:
        return ''
    
    # Remove non-digit characters for processing
    digits_only = re.sub(r'\D', '', value)
    
    if len(digits_only) <= 4:
        return '*' * len(digits_only)
    
    # Keep last 4 digits visible
    masked_part = '*' * (len(digits_only) - 4)
    visible_part = digits_only[-4:]
    return masked_part + visible_part


def mask_name(value: str) -> str:
    """
    Mask personal name keeping only first character visible.
    
    Example: dhanya → d*****
    """
    if not value:
        return ''
    
    value = value.strip()
    if len(value) <= 1:
        return value
    
    return value[0] + '*' * (len(value) - 1)


def mask_address(value: str) -> str:
    """
    Mask address keeping only last 2 characters visible.
    
    Example: ayampet → *****et
    """
    if not value:
        return ''
    
    value = value.strip()
    if len(value) <= 2:
        return '*' * len(value)
    
    return '*' * (len(value) - 2) + value[-2:]


def mask_account_number(value: str) -> str:
    """
    Mask account number keeping last 2 digits visible.
    
    Example: 234543 → ****43
    """
    if not value:
        return ''
    
    # Remove non-alphanumeric characters
    clean_value = re.sub(r'[^a-zA-Z0-9]', '', value)
    
    if len(clean_value) <= 2:
        return '*' * len(clean_value)
    
    return '*' * (len(clean_value) - 2) + clean_value[-2:]


def mask_credit_card(value: str) -> str:
    """
    Mask credit card number keeping last 4 digits visible.
    
    Example: 4532015112830366 → ************0366
    """
    if not value:
        return ''
    
    # Remove non-digit characters
    digits_only = re.sub(r'\D', '', value)
    
    if len(digits_only) <= 4:
        return '*' * len(digits_only)
    
    return '*' * (len(digits_only) - 4) + digits_only[-4:]


def mask_ssn(value: str) -> str:
    """
    Mask SSN keeping last 4 digits visible with format.
    
    Example: 123-45-6789 → ***-**-6789
    """
    if not value:
        return ''
    
    # Remove non-digit characters
    digits_only = re.sub(r'\D', '', value)
    
    if len(digits_only) < 9:
        if len(digits_only) <= 4:
            return '*' * len(digits_only)
        return '*' * (len(digits_only) - 4) + digits_only[-4:]
    
    # Format as SSN with masking
    return f"***-**-{digits_only[-4:]}"


def mask_aadhaar(value: str) -> str:
    """
    Mask Aadhaar number keeping last 4 digits visible.
    
    Example: 1234 5678 9012 → **** **** 9012
    """
    if not value:
        return ''
    
    # Remove non-digit characters
    digits_only = re.sub(r'\D', '', value)
    
    if len(digits_only) <= 4:
        return '*' * len(digits_only)
    
    if len(digits_only) == 12:
        return f"**** **** {digits_only[-4:]}"
    
    return '*' * (len(digits_only) - 4) + digits_only[-4:]


def mask_pan(value: str) -> str:
    """
    Mask PAN card keeping last 4 characters visible.
    
    Example: ABCDE1234F → ******234F
    """
    if not value:
        return ''
    
    value = value.strip().upper()
    
    if len(value) <= 4:
        return '*' * len(value)
    
    return '*' * (len(value) - 4) + value[-4:]


def mask_generic(value: str) -> str:
    """
    Generic masking - keep first and last character, mask middle.
    
    Example: sensitive → s********e
    """
    if not value:
        return ''
    
    value = str(value).strip()
    
    if len(value) <= 2:
        return '*' * len(value)
    
    return value[0] + '*' * (len(value) - 2) + value[-1]


# ============================================================================
# STRATEGY MAPPING
# ============================================================================

# Map PII types to masking strategies
PII_TYPE_TO_STRATEGY: Dict[str, str] = {
    'email': 'email_mask',
    'phone': 'phone_mask',
    'name': 'name_mask',
    'address': 'address_mask',
    'card': 'card_mask',
    'ssn': 'ssn_mask',
    'aadhaar': 'aadhaar_mask',
    'pan': 'pan_mask',
    'account': 'account_mask',
    'other': 'generic_mask',
}

# Map strategies to masking functions
MASKING_FUNCTIONS: Dict[str, Callable[[str], str]] = {
    'email_mask': mask_email,
    'phone_mask': mask_phone,
    'name_mask': mask_name,
    'address_mask': mask_address,
    'account_mask': mask_account_number,
    'card_mask': mask_credit_card,
    'ssn_mask': mask_ssn,
    'aadhaar_mask': mask_aadhaar,
    'pan_mask': mask_pan,
    'generic_mask': mask_generic,
}


def get_strategy_for_pii_type(pii_type: str) -> str:
    """Get the appropriate masking strategy for a PII type."""
    return PII_TYPE_TO_STRATEGY.get(pii_type, 'generic_mask')


def apply_masking(value: str, strategy: str) -> str:
    """Apply a masking strategy to a value."""
    masking_func = MASKING_FUNCTIONS.get(strategy, mask_generic)
    return masking_func(value)


# ============================================================================
# SAMPLE DATA FOR PREVIEWS
# ============================================================================

SAMPLE_DATA: Dict[str, str] = {
    'email': 'dhanya@gmail.com',
    'phone': '9999872123',
    'name': 'Dhanya Rajesh',
    'address': '123 Main Street, Ayampet',
    'card': '4532015112830366',
    'ssn': '123-45-6789',
    'aadhaar': '1234 5678 9012',
    'pan': 'ABCDE1234F',
    'account': '1234567890',
    'other': 'sensitive_data',
}


def get_sample_for_pii_type(pii_type: str) -> str:
    """Get sample data for a PII type."""
    return SAMPLE_DATA.get(pii_type, 'sample_data')


# ============================================================================
# MASKING SERVICE CLASS
# ============================================================================

class MaskingService:
    """
    Service class for executing masking jobs.
    
    Handles the complete masking workflow:
    1. Analysis - Identify fields to mask
    2. Strategy Selection - Assign masking strategies
    3. Execution - Apply masking with progress updates
    4. Validation - Verify masking completion
    """
    
    def __init__(self, job_id: str):
        """Initialize the service with a job ID."""
        self.job_id = job_id
        self._progress_callbacks: List[Callable] = []
    
    def add_progress_callback(self, callback: Callable):
        """Add a callback to receive progress updates."""
        self._progress_callbacks.append(callback)
    
    def _emit_progress(self, event: Dict[str, Any]):
        """Emit progress event to all registered callbacks."""
        event['job_id'] = str(self.job_id)
        event['timestamp'] = datetime.now().isoformat()
        
        for callback in self._progress_callbacks:
            try:
                callback(event)
            except Exception as e:
                logger.error(f"Error in progress callback: {e}")
    
    def execute_masking(
        self,
        fields: List[Dict[str, Any]],
        delay_per_field: float = 1.5
    ) -> Generator[Dict[str, Any], None, None]:
        """
        Execute masking on a list of fields with progress updates.
        
        Args:
            fields: List of field dictionaries with table_name, column_name, pii_type
            delay_per_field: Simulated delay per field (seconds)
        
        Yields:
            Progress events as dictionaries
        """
        total_fields = len(fields)
        
        # Step 1: Analysis
        yield {
            'job_id': str(self.job_id),
            'step': 'analysis',
            'message': f'Analyzing {total_fields} detected PII fields',
            'progress': 5,
            'timestamp': datetime.now().isoformat(),
        }
        time.sleep(0.5)
        
        # Step 2: Strategy Selection
        yield {
            'job_id': str(self.job_id),
            'step': 'strategy_selection',
            'message': 'Selecting masking strategies for each field',
            'progress': 10,
            'timestamp': datetime.now().isoformat(),
        }
        
        # Assign strategies to fields
        field_strategies = []
        for field in fields:
            pii_type = field.get('pii_type', 'other')
            strategy = get_strategy_for_pii_type(pii_type)
            field_strategies.append({
                **field,
                'strategy': strategy,
            })
        
        time.sleep(0.5)
        
        yield {
            'job_id': str(self.job_id),
            'step': 'strategy_selection',
            'message': f'Assigned masking strategies to {total_fields} fields',
            'progress': 15,
            'strategies': [
                {
                    'field': f.get('column_name', f.get('field_name', 'unknown')),
                    'pii_type': f.get('pii_type', 'other'),
                    'strategy': f.get('strategy', 'generic_mask'),
                }
                for f in field_strategies
            ],
            'timestamp': datetime.now().isoformat(),
        }
        
        # Step 3: Masking Execution
        yield {
            'job_id': str(self.job_id),
            'step': 'masking',
            'message': 'Starting masking process',
            'progress': 20,
            'timestamp': datetime.now().isoformat(),
        }
        
        masked_results = []
        progress_per_field = 60 / max(total_fields, 1)
        
        for idx, field in enumerate(field_strategies):
            field_name = field.get('column_name', field.get('field_name', 'unknown'))
            pii_type = field.get('pii_type', 'other')
            strategy = field.get('strategy', 'generic_mask')
            
            # Emit processing status
            yield {
                'job_id': str(self.job_id),
                'step': 'masking',
                'field': field_name,
                'pii_type': pii_type,
                'strategy': strategy,
                'status': 'processing',
                'message': f'Processing {field_name} ({pii_type})',
                'progress': 20 + int(idx * progress_per_field),
                'current_field': idx + 1,
                'total_fields': total_fields,
                'timestamp': datetime.now().isoformat(),
            }
            
            # Simulate processing delay
            time.sleep(delay_per_field)
            
            # Apply masking to sample data
            sample_value = get_sample_for_pii_type(pii_type)
            masked_value = apply_masking(sample_value, strategy)
            
            masked_results.append({
                'field': field_name,
                'table': field.get('table_name', 'unknown'),
                'pii_type': pii_type,
                'strategy': strategy,
                'original_sample': sample_value,
                'masked_sample': masked_value,
            })
            
            # Emit completed status for this field
            yield {
                'job_id': str(self.job_id),
                'step': 'masking',
                'field': field_name,
                'pii_type': pii_type,
                'strategy': strategy,
                'status': 'completed',
                'message': f'Completed masking {field_name}',
                'original_sample': sample_value,
                'masked_sample': masked_value,
                'progress': 20 + int((idx + 1) * progress_per_field),
                'current_field': idx + 1,
                'total_fields': total_fields,
                'timestamp': datetime.now().isoformat(),
            }
        
        # Step 4: Validation
        yield {
            'job_id': str(self.job_id),
            'step': 'validation',
            'message': 'Validating masked data',
            'progress': 85,
            'timestamp': datetime.now().isoformat(),
        }
        
        time.sleep(0.5)
        
        # Validate all fields are masked
        validation_passed = all(r.get('masked_sample') for r in masked_results)
        
        yield {
            'job_id': str(self.job_id),
            'step': 'validation',
            'message': 'Validation complete - all fields masked successfully' if validation_passed else 'Validation found issues',
            'validation_passed': validation_passed,
            'progress': 95,
            'timestamp': datetime.now().isoformat(),
        }
        
        # Step 5: Completion
        yield {
            'job_id': str(self.job_id),
            'step': 'completed',
            'message': f'Masking job completed - {total_fields} fields processed',
            'progress': 100,
            'total_fields': total_fields,
            'results': masked_results,
            'timestamp': datetime.now().isoformat(),
        }


def create_masking_job_from_detected_fields(project, table_name: str = None):
    """
    Create a MaskingJob and MaskingFields from detected PII fields.
    
    Args:
        project: Project model instance
        table_name: Optional table name to filter fields
    
    Returns:
        Tuple of (MaskingJob, list of field dictionaries)
    """
    from .models import MaskingJob, MaskingField, MaskingLog, DetectedPIIField
    
    # Get detected PII fields for the project
    detected_fields = DetectedPIIField.objects.filter(project=project)
    if table_name:
        detected_fields = detected_fields.filter(table_name=table_name)
    
    detected_fields = list(detected_fields)
    
    if not detected_fields:
        return None, []
    
    # Get database name from connection
    db_connection = project.db_connections.filter(status='success').first()
    database_name = db_connection.database_name if db_connection else 'unknown'
    
    # Create the masking job
    job = MaskingJob.objects.create(
        project=project,
        database_name=database_name,
        table_name=table_name,
        status='pending',
        total_fields=len(detected_fields),
        processed_fields=0,
    )
    
    # Create masking fields
    fields_data = []
    for detected in detected_fields:
        strategy = get_strategy_for_pii_type(detected.pii_type)
        sample = get_sample_for_pii_type(detected.pii_type)
        
        MaskingField.objects.create(
            job=job,
            detected_field=detected,
            table_name=detected.table_name,
            column_name=detected.field_name,
            pii_type=detected.pii_type,
            masking_strategy=strategy,
            original_sample=sample,
            status='pending',
        )
        
        fields_data.append({
            'table_name': detected.table_name,
            'column_name': detected.field_name,
            'field_name': detected.field_name,
            'pii_type': detected.pii_type,
        })
    
    # Log job creation
    MaskingLog.objects.create(
        job=job,
        step='analysis',
        message=f'Masking job created with {len(detected_fields)} fields',
        level='info',
    )
    
    return job, fields_data
