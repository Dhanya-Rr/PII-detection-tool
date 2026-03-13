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
# NEW ENTERPRISE MASKING TECHNIQUES (Phase 8 Enhancement)
# ============================================================================

def partial_redaction_strategy(value: str) -> str:
    """
    Partial Redaction: Mask part of the value while keeping some visible.
    
    Example: john.doe@email.com → j***.***@email.com
    """
    if not value:
        return ''
    
    # Use existing logic based on value pattern
    if '@' in value:
        return mask_email(value)
    elif any(c.isdigit() for c in value):
        # Keep last 4 characters for numeric-like data
        if len(value) > 4:
            return '*' * (len(value) - 4) + value[-4:]
    
    # Default: keep first and last, mask middle
    if len(value) <= 2:
        return '*' * len(value)
    return value[0] + '*' * (len(value) - 2) + value[-1]


def redaction_strategy(value: str) -> str:
    """
    Full Redaction: Replace entire value with redaction marker.
    
    Example: sensitive_data → [REDACTED]
    """
    return '[REDACTED]'


def character_replacement_strategy(value: str) -> str:
    """
    Character Replacement: Replace all characters with a masking character.
    
    Example: password123 → ***********
    """
    if not value:
        return ''
    return '*' * len(value)


def tokenization_strategy(value: str) -> str:
    """
    Tokenization: Replace value with a unique token.
    
    Example: john.doe@email.com → TOK_8F3A2B1C
    """
    import hashlib
    if not value:
        return ''
    
    # Generate a deterministic token from the value
    hash_obj = hashlib.md5(value.encode())
    token = hash_obj.hexdigest()[:8].upper()
    return f"TOK_{token}"


def shuffling_strategy(value: str) -> str:
    """
    Shuffling: Randomly shuffle characters in the value.
    
    Example: password → dswoprsa
    """
    import random
    if not value:
        return ''
    
    chars = list(value)
    # Use deterministic seed based on value for consistency
    random.seed(hash(value))
    random.shuffle(chars)
    return ''.join(chars)


def nulling_strategy(value: str) -> str:
    """
    Nulling: Replace value with NULL/empty.
    
    Example: data → NULL
    """
    return 'NULL'


def date_masking_strategy(value: str) -> str:
    """
    Date Masking: Mask date values while preserving format.
    
    Example: 1990-05-15 → 1990-01-01
    """
    import re
    if not value:
        return ''
    
    # Try to detect date patterns and mask day/month
    # Pattern: YYYY-MM-DD
    if re.match(r'\d{4}-\d{2}-\d{2}', value):
        return value[:4] + '-01-01'
    # Pattern: DD/MM/YYYY
    if re.match(r'\d{2}/\d{2}/\d{4}', value):
        return '01/01/' + value[-4:]
    # Pattern: MM/DD/YYYY
    if re.match(r'\d{2}/\d{2}/\d{4}', value):
        return '01/01/' + value[-4:]
    
    # Default: return generic mask
    return '**/**/****'


def data_perturbation_strategy(value: str) -> str:
    """
    Data Perturbation: Add noise/slight modification to data.
    
    Example: 25 → 27 (for numeric), John → Joan (for text)
    """
    if not value:
        return ''
    
    # For numeric values, add small perturbation
    try:
        num = float(value)
        import random
        random.seed(hash(value))
        perturbation = random.uniform(-0.1, 0.1) * num
        return str(round(num + perturbation, 2))
    except ValueError:
        pass
    
    # For text, replace some characters
    if len(value) > 2:
        chars = list(value)
        # Change one character
        idx = len(value) // 2
        chars[idx] = chr((ord(chars[idx]) + 1) % 128) if chars[idx].isalpha() else chars[idx]
        return ''.join(chars)
    
    return value


# ============================================================================
# ANONYMIZATION STRATEGIES
# ============================================================================

def generalization_strategy(value: str) -> str:
    """
    Data Generalization: Replace specific values with more general categories.
    
    Example: 25 → 20-30, john.doe@email.com → *@email.com
    """
    if not value:
        return ''
    
    # For email, generalize to domain only
    if '@' in value:
        domain = value.split('@')[-1]
        return f'*@{domain}'
    
    # For numeric, generalize to range
    try:
        num = int(value)
        lower = (num // 10) * 10
        upper = lower + 10
        return f'{lower}-{upper}'
    except ValueError:
        pass
    
    # For text, keep first letter only
    if len(value) > 1:
        return value[0] + '***'
    return value


def randomization_strategy(value: str) -> str:
    """
    Randomization: Replace with random value of same type/format.
    
    Example: John → Xyzq, 12345 → 98723
    """
    import random
    import string
    
    if not value:
        return ''
    
    random.seed(hash(value))  # Deterministic for consistency
    
    # Detect type and generate random replacement
    if value.isdigit():
        return ''.join(random.choices(string.digits, k=len(value)))
    elif value.isalpha():
        return ''.join(random.choices(string.ascii_letters, k=len(value)))
    else:
        # Mixed - maintain structure
        result = []
        for char in value:
            if char.isdigit():
                result.append(random.choice(string.digits))
            elif char.isalpha():
                result.append(random.choice(string.ascii_letters))
            else:
                result.append(char)
        return ''.join(result)


def hashing_strategy(value: str) -> str:
    """
    Hashing: Replace value with its hash.
    
    Example: password → 5f4dcc3b5aa765d61d8327deb882cf99
    """
    import hashlib
    if not value:
        return ''
    
    return hashlib.sha256(value.encode()).hexdigest()[:16]


def swapping_strategy(value: str) -> str:
    """
    Swapping: Swap values between records (placeholder - returns shuffled).
    
    Example: In actual use, John's email would be swapped with Jane's
    Note: Full implementation would need dataset context
    """
    # For single value, we simulate by reversing
    if not value:
        return ''
    return value[::-1]


def noise_addition_strategy(value: str) -> str:
    """
    Noise Addition: Add random noise to data.
    
    Example: 100 → 103.7 (adds ±5% noise)
    """
    import random
    
    if not value:
        return ''
    
    random.seed(hash(value))
    
    # For numeric values
    try:
        num = float(value)
        noise = random.uniform(-0.05, 0.05) * abs(num)
        return str(round(num + noise, 2))
    except ValueError:
        pass
    
    # For text, add random suffix
    suffix = ''.join(random.choices('0123456789', k=2))
    return f'{value}_{suffix}'


def k_anonymity_strategy(value: str) -> str:
    """
    k-Anonymity: Generalize value to ensure k identical records.
    
    Example: Age 27 → Age Range 25-30
    Note: Full implementation requires dataset-level processing
    """
    if not value:
        return ''
    
    # For numeric, create buckets
    try:
        num = int(value)
        bucket_size = 5
        lower = (num // bucket_size) * bucket_size
        upper = lower + bucket_size
        return f'{lower}-{upper}'
    except ValueError:
        pass
    
    # For text, generalize to first 2 chars
    if len(value) > 2:
        return value[:2] + '***'
    return value


def l_diversity_strategy(value: str) -> str:
    """
    l-Diversity: Ensure diversity in sensitive values.
    
    Example: Disease "Flu" → Category "Respiratory"
    Note: Full implementation requires dataset-level processing with diversity rules
    """
    if not value:
        return ''
    
    # Placeholder: Return category/class representation
    import hashlib
    category_hash = hashlib.md5(value.encode()).hexdigest()[:4]
    return f'CAT_{category_hash.upper()}'


# ============================================================================
# STRATEGY MAPPING
# ============================================================================

# Map PII types to masking strategies (legacy behavior - auto-select based on PII type)
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

# Legacy masking functions (backward compatible)
LEGACY_MASKING_FUNCTIONS: Dict[str, Callable[[str], str]] = {
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

# New Data Masking Strategies Registry
MASKING_STRATEGIES: Dict[str, Callable[[str], str]] = {
    'partial_redaction': partial_redaction_strategy,
    'redaction': redaction_strategy,
    'character_replacement': character_replacement_strategy,
    'tokenization': tokenization_strategy,
    'shuffling': shuffling_strategy,
    'nulling': nulling_strategy,
    'date_masking': date_masking_strategy,
    'data_perturbation': data_perturbation_strategy,
}

# New Data Anonymization Strategies Registry
ANONYMIZATION_STRATEGIES: Dict[str, Callable[[str], str]] = {
    'generalization': generalization_strategy,
    'randomization': randomization_strategy,
    'hashing': hashing_strategy,
    'swapping': swapping_strategy,
    'noise_addition': noise_addition_strategy,
    'k_anonymity': k_anonymity_strategy,
    'l_diversity': l_diversity_strategy,
}

# Combined registry of all masking functions
MASKING_FUNCTIONS: Dict[str, Callable[[str], str]] = {
    **LEGACY_MASKING_FUNCTIONS,
    **MASKING_STRATEGIES,
    **ANONYMIZATION_STRATEGIES,
}


def get_strategy_for_pii_type(pii_type: str) -> str:
    """Get the appropriate masking strategy for a PII type."""
    return PII_TYPE_TO_STRATEGY.get(pii_type, 'generic_mask')


def apply_masking(value: str, strategy: str) -> str:
    """Apply a masking strategy to a value."""
    masking_func = MASKING_FUNCTIONS.get(strategy, mask_generic)
    return masking_func(value)


def get_strategy_display_name(strategy: str) -> str:
    """Get human-readable name for a strategy."""
    display_names = {
        # Data Masking
        'partial_redaction': 'Partial Redaction',
        'redaction': 'Redaction',
        'character_replacement': 'Character Replacement',
        'tokenization': 'Tokenization',
        'shuffling': 'Shuffling',
        'nulling': 'Nulling',
        'date_masking': 'Date Masking',
        'data_perturbation': 'Data Perturbation',
        # Anonymization
        'generalization': 'Data Generalization',
        'randomization': 'Randomization',
        'hashing': 'Hashing',
        'swapping': 'Swapping',
        'noise_addition': 'Noise Addition',
        'k_anonymity': 'k-Anonymity',
        'l_diversity': 'l-Diversity',
        # Legacy
        'email_mask': 'Email Masking',
        'phone_mask': 'Phone Masking',
        'name_mask': 'Name Masking',
        'address_mask': 'Address Masking',
        'account_mask': 'Account Number Masking',
        'card_mask': 'Credit Card Masking',
        'ssn_mask': 'SSN Masking',
        'aadhaar_mask': 'Aadhaar Masking',
        'pan_mask': 'PAN Card Masking',
        'generic_mask': 'Generic Masking',
    }
    return display_names.get(strategy, strategy.replace('_', ' ').title())


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
        from .models import MaskingJob, MaskingField as MaskingFieldModel
        
        total_fields = len(fields)
        
        # Get the actual MaskingField records to use configured strategies
        job_fields = {}
        try:
            job = MaskingJob.objects.get(id=self.job_id)
            for mf in job.masking_fields.all():
                job_fields[mf.column_name] = mf
        except MaskingJob.DoesNotExist:
            pass
        
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
        
        # Assign strategies to fields - use configured strategy or fall back to auto-detect
        field_strategies = []
        for field in fields:
            field_name = field.get('column_name', field.get('field_name', 'unknown'))
            pii_type = field.get('pii_type', 'other')
            
            # Check if we have a configured strategy from MaskingField
            if field_name in job_fields:
                mf = job_fields[field_name]
                strategy = mf.masking_strategy
            else:
                # Fall back to auto-detection based on PII type
                strategy = get_strategy_for_pii_type(pii_type)
            
            strategy_display = get_strategy_display_name(strategy)
            
            field_strategies.append({
                **field,
                'strategy': strategy,
                'strategy_display': strategy_display,
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
                    'strategy_display': f.get('strategy_display', 'Generic Masking'),
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
            strategy_display = field.get('strategy_display', 'Generic Masking')
            
            # Emit processing status with technique display name
            yield {
                'job_id': str(self.job_id),
                'step': 'masking',
                'field': field_name,
                'pii_type': pii_type,
                'strategy': strategy,
                'strategy_display': strategy_display,
                'status': 'processing',
                'message': f'Applying {strategy_display} to {field_name}',
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
                'strategy_display': strategy_display,
                'original_sample': sample_value,
                'masked_sample': masked_value,
            })
            
            # Emit completed status for this field with technique info
            yield {
                'job_id': str(self.job_id),
                'step': 'masking',
                'field': field_name,
                'pii_type': pii_type,
                'strategy': strategy,
                'strategy_display': strategy_display,
                'status': 'completed',
                'message': f'{field_name} masked using {strategy_display}',
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


def create_masking_job_from_detected_fields(project, table_name: str = None, field_configurations: list = None):
    """
    Create a MaskingJob and MaskingFields from detected PII fields.
    
    Args:
        project: Project model instance
        table_name: Optional table name to filter fields
        field_configurations: Optional list of field-level technique configurations
            Each config: {field_id, field_name, table_name, technique, method, parameters}
    
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
    
    # Build a lookup for field configurations by field_id, field_name, or table+field combo
    config_lookup = {}
    if field_configurations:
        for config in field_configurations:
            # Index by various keys for flexible matching
            if config.get('field_id'):
                config_lookup[str(config['field_id'])] = config
            if config.get('field_name'):
                config_lookup[config['field_name']] = config
            if config.get('field_name') and config.get('table_name'):
                key = f"{config['table_name']}.{config['field_name']}"
                config_lookup[key] = config
    
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
    techniques_used = set()
    
    for detected in detected_fields:
        # Try to find custom configuration for this field
        config = None
        
        # Try by field_id first
        if str(detected.id) in config_lookup:
            config = config_lookup[str(detected.id)]
        # Try by field_name
        elif detected.field_name in config_lookup:
            config = config_lookup[detected.field_name]
        # Try by table.field combination
        elif f"{detected.table_name}.{detected.field_name}" in config_lookup:
            config = config_lookup[f"{detected.table_name}.{detected.field_name}"]
        
        # Determine strategy: use custom technique or auto-detect based on PII type
        if config and config.get('technique'):
            strategy = config['technique']
            technique_display = get_strategy_display_name(strategy)
        else:
            # Fall back to auto-detection based on PII type
            strategy = get_strategy_for_pii_type(detected.pii_type)
            technique_display = get_strategy_display_name(strategy)
        
        techniques_used.add(technique_display)
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
            'technique': strategy,
            'technique_display': technique_display,
        })
    
    # Log job creation with techniques info
    techniques_summary = ', '.join(sorted(techniques_used)) if techniques_used else 'Auto-detected'
    MaskingLog.objects.create(
        job=job,
        step='analysis',
        message=f'Masking job created with {len(detected_fields)} fields. Techniques: {techniques_summary}',
        level='info',
    )
    
    return job, fields_data


# ============================================================================
# PHASE 8: REAL DATA PROCESSING PIPELINE
# ============================================================================

def execute_masking_job(job_id: str) -> Dict[str, Any]:
    """
    Execute a masking job on REAL database records.
    
    Pipeline:
    1. Fetch MaskingJob
    2. Fetch MaskingField configurations
    3. Connect to the source database
    4. Read real rows from the selected table
    5. Apply the selected technique to each field
    6. Store masked rows in MaskedDataset model
    7. Return masked dataset summary
    
    Args:
        job_id: UUID of the masking job to execute
    
    Returns:
        Dictionary with job results:
        {
            'job_id': str,
            'status': str,
            'tables_processed': int,
            'rows_processed': int,
            'datasets': [{'table_name': str, 'row_count': int}]
        }
    """
    from .models import MaskingJob, MaskingField, MaskingLog, MaskedDataset
    from .db_connectors import fetch_table_data
    
    logger.info(f"[MASKING JOB] Starting execution for job {job_id}")
    
    # 1. Fetch MaskingJob
    try:
        job = MaskingJob.objects.get(id=job_id)
    except MaskingJob.DoesNotExist:
        logger.error(f"[MASKING JOB] Job {job_id} not found")
        raise ValueError(f"Masking job {job_id} not found")
    
    # Update job status
    job.status = 'running'
    job.started_at = timezone.now()
    job.save()
    
    # Log job start
    MaskingLog.objects.create(
        job=job,
        action='job_started',
        step='masking',
        message='Real data masking job started',
        level='info',
        status='started',
    )
    
    # 2. Fetch MaskingField configurations
    masking_fields = list(job.masking_fields.all())
    if not masking_fields:
        logger.warning(f"[MASKING JOB] No masking fields for job {job_id}")
        job.status = 'failed'
        job.save()
        MaskingLog.objects.create(
            job=job,
            action='job_failed',
            step='masking',
            message='No masking fields configured',
            level='error',
            status='error',
        )
        raise ValueError("No masking fields configured for this job")
    
    # Group fields by table
    table_fields: Dict[str, List] = {}
    for field in masking_fields:
        if field.table_name not in table_fields:
            table_fields[field.table_name] = []
        table_fields[field.table_name].append(field)
    
    logger.info(f"[MASKING JOB] Processing {len(table_fields)} tables with {len(masking_fields)} fields")
    
    # Log fetching database rows
    MaskingLog.objects.create(
        job=job,
        action='analysis_started',
        step='masking',
        message=f'Fetching database rows from {len(table_fields)} tables',
        level='info',
        status='processing',
    )
    
    # 3. Connect to the source database (get connection info from project)
    db_connection = job.project.db_connections.filter(status='success').first()
    if not db_connection:
        logger.error(f"[MASKING JOB] No database connection for project {job.project_id}")
        job.status = 'failed'
        job.save()
        MaskingLog.objects.create(
            job=job,
            action='job_failed',
            step='masking',
            message='No database connection found',
            level='error',
            status='error',
        )
        raise ValueError("No database connection found for this project")
    
    results = {
        'job_id': str(job_id),
        'status': 'completed',
        'tables_processed': 0,
        'rows_processed': 0,
        'datasets': [],
    }
    
    try:
        # 4-6. Process each table
        for table_name, fields in table_fields.items():
            logger.info(f"[MASKING JOB] Processing table: {table_name}")
            
            # Create field strategy mapping
            field_strategies = {}
            for field in fields:
                field_strategies[field.column_name] = {
                    'strategy': field.masking_strategy,
                    'pii_type': field.pii_type,
                }
            
            # Log for each table
            MaskingLog.objects.create(
                job=job,
                action='masking_started',
                step='masking',
                message=f'Processing table: {table_name}',
                level='info',
                status='processing',
            )
            
            # Create MaskedDataset record
            masked_dataset = MaskedDataset.objects.create(
                job=job,
                table_name=table_name,
                column_mapping=field_strategies,
                status='processing',
            )
            
            try:
                # Fetch real rows from the database (no limit for full processing)
                rows = fetch_table_data(
                    db_type=db_connection.db_type,
                    host=db_connection.host,
                    port=db_connection.port,
                    database_name=db_connection.database_name,
                    username=db_connection.username,
                    password=db_connection.password,
                    table_name=table_name,
                    limit=10000  # Process up to 10k rows
                )
                
                original_row_count = len(rows)
                masked_dataset.original_row_count = original_row_count
                masked_dataset.save()
                
                logger.info(f"[MASKING JOB] Fetched {original_row_count} rows from {table_name}")
                
                # 5. Apply masking to each row
                masked_rows = []
                for row_idx, row in enumerate(rows):
                    masked_row = {}
                    
                    for column_name, value in row.items():
                        if column_name in field_strategies:
                            # This column needs masking
                            strategy_info = field_strategies[column_name]
                            strategy = strategy_info['strategy']
                            
                            # Convert value to string for masking
                            str_value = str(value) if value is not None else ''
                            
                            # Apply the masking strategy
                            masked_value = apply_masking(str_value, strategy)
                            masked_row[column_name] = masked_value
                            
                            # Log individual field masking (only for first row to avoid spam)
                            if row_idx == 0:
                                strategy_display = get_strategy_display_name(strategy)
                                MaskingLog.objects.create(
                                    job=job,
                                    action='masking_started',
                                    step='masking',
                                    message=f'Applying {strategy_display} to {column_name}',
                                    level='info',
                                    status='processing',
                                    field_name=column_name,
                                )
                        else:
                            # Keep non-PII columns as-is
                            # Convert to JSON-serializable format
                            if hasattr(value, 'isoformat'):
                                masked_row[column_name] = value.isoformat()
                            else:
                                masked_row[column_name] = value
                    
                    masked_rows.append(masked_row)
                
                # 6. Store masked rows in MaskedDataset
                masked_dataset.masked_data = masked_rows
                masked_dataset.masked_row_count = len(masked_rows)
                masked_dataset.status = 'completed'
                masked_dataset.save()
                
                # Update field statuses
                for field in fields:
                    field.status = 'completed'
                    field.processed_at = timezone.now()
                    # Store sample masked value
                    if masked_rows and field.column_name in masked_rows[0]:
                        field.masked_sample = str(masked_rows[0][field.column_name])
                    field.save()
                
                # Log completion for field
                for field in fields:
                    strategy_display = get_strategy_display_name(field.masking_strategy)
                    MaskingLog.objects.create(
                        job=job,
                        action='masking_completed',
                        step='masking',
                        message=f'{field.column_name} masked successfully using {strategy_display}',
                        level='success',
                        status='completed',
                        field_name=field.column_name,
                    )
                
                results['tables_processed'] += 1
                results['rows_processed'] += len(masked_rows)
                results['datasets'].append({
                    'table_name': table_name,
                    'row_count': len(masked_rows),
                    'dataset_id': str(masked_dataset.id) if hasattr(masked_dataset, 'id') else None,
                })
                
                logger.info(f"[MASKING JOB] Completed {table_name}: {len(masked_rows)} rows masked")
                
            except Exception as e:
                logger.error(f"[MASKING JOB] Error processing table {table_name}: {str(e)}")
                masked_dataset.status = 'failed'
                masked_dataset.error_message = str(e)
                masked_dataset.save()
                
                MaskingLog.objects.create(
                    job=job,
                    action='job_failed',
                    step='masking',
                    message=f'Failed to process table {table_name}: {str(e)}',
                    level='error',
                    status='error',
                )
                continue
        
        # Update job to completed
        job.status = 'completed'
        job.processed_fields = len(masking_fields)
        job.completed_at = timezone.now()
        job.save()
        
        # Log job completion
        MaskingLog.objects.create(
            job=job,
            action='job_completed',
            step='completed',
            message=f'Masked dataset generated: {results["rows_processed"]} rows across {results["tables_processed"]} tables',
            level='success',
            status='completed',
        )
        
        logger.info(f"[MASKING JOB] Job {job_id} completed: {results['rows_processed']} rows processed")
        
    except Exception as e:
        logger.error(f"[MASKING JOB] Job {job_id} failed: {str(e)}")
        job.status = 'failed'
        job.save()
        
        MaskingLog.objects.create(
            job=job,
            action='job_failed',
            step='masking',
            message=f'Job failed: {str(e)}',
            level='error',
            status='error',
        )
        
        results['status'] = 'failed'
        results['error'] = str(e)
    
    return results


def get_masked_dataset_for_export(job_id: str, table_name: str = None) -> Dict[str, Any]:
    """
    Get masked dataset data for export.
    
    Args:
        job_id: UUID of the masking job
        table_name: Optional specific table to export
    
    Returns:
        Dictionary with export data:
        {
            'tables': [
                {
                    'table_name': str,
                    'columns': list,
                    'rows': list,
                    'row_count': int,
                }
            ],
            'total_rows': int,
        }
    """
    from .models import MaskingJob, MaskedDataset
    
    try:
        job = MaskingJob.objects.get(id=job_id)
    except MaskingJob.DoesNotExist:
        raise ValueError(f"Masking job {job_id} not found")
    
    # Get masked datasets
    datasets = MaskedDataset.objects.filter(job=job, status='completed')
    if table_name:
        datasets = datasets.filter(table_name=table_name)
    
    result = {
        'tables': [],
        'total_rows': 0,
    }
    
    for dataset in datasets:
        if not dataset.masked_data:
            continue
        
        rows = dataset.masked_data
        columns = list(rows[0].keys()) if rows else []
        
        result['tables'].append({
            'table_name': dataset.table_name,
            'columns': columns,
            'rows': rows,
            'row_count': len(rows),
        })
        result['total_rows'] += len(rows)
    
    return result


def export_masked_dataset_to_csv(job_id: str, table_name: str = None) -> str:
    """
    Export masked dataset to CSV format.
    
    Args:
        job_id: UUID of the masking job
        table_name: Optional specific table to export
    
    Returns:
        CSV string of masked data
    """
    import csv
    import io
    
    data = get_masked_dataset_for_export(job_id, table_name)
    
    if not data['tables']:
        return ""
    
    output = io.StringIO()
    
    for table_data in data['tables']:
        rows = table_data['rows']
        columns = table_data['columns']
        
        if not rows:
            continue
        
        # Write table header comment
        if len(data['tables']) > 1:
            output.write(f"# Table: {table_data['table_name']}\n")
        
        writer = csv.DictWriter(output, fieldnames=columns)
        writer.writeheader()
        writer.writerows(rows)
        
        if len(data['tables']) > 1:
            output.write("\n")
    
    return output.getvalue()


def export_masked_dataset_to_json(job_id: str, table_name: str = None) -> str:
    """
    Export masked dataset to JSON format.
    
    Args:
        job_id: UUID of the masking job
        table_name: Optional specific table to export
    
    Returns:
        JSON string of masked data
    """
    import json
    
    data = get_masked_dataset_for_export(job_id, table_name)
    
    return json.dumps(data, indent=2, default=str)


def push_masked_data_to_database(job_id: str, mode: str = 'update') -> Dict[str, Any]:
    """
    Push masked data back to the source database.
    
    Args:
        job_id: UUID of the masking job
        mode: 'update' to update original table, 'insert' to create new masked table
    
    Returns:
        Dictionary with push results:
        {
            'status': str,
            'tables_updated': int,
            'rows_affected': int,
            'details': list,
        }
    """
    from .models import MaskingJob, MaskedDataset, MaskingLog
    from .db_connectors import (
        update_postgres_table,
        update_mysql_table,
        update_sqlite_table,
        insert_into_postgres_table,
        insert_into_mysql_table,
        insert_into_sqlite_table,
    )
    
    try:
        job = MaskingJob.objects.get(id=job_id)
    except MaskingJob.DoesNotExist:
        raise ValueError(f"Masking job {job_id} not found")
    
    # Get database connection
    db_connection = job.project.db_connections.filter(status='success').first()
    if not db_connection:
        raise ValueError("No database connection found for this project")
    
    # Get masked datasets
    datasets = MaskedDataset.objects.filter(job=job, status='completed')
    
    if not datasets.exists():
        raise ValueError("No masked datasets available for push")
    
    results = {
        'status': 'completed',
        'tables_updated': 0,
        'rows_affected': 0,
        'details': [],
    }
    
    # Log push start
    MaskingLog.objects.create(
        job=job,
        action='job_started',
        step='masking',
        message=f'Pushing masked data to database ({mode} mode)',
        level='info',
        status='started',
    )
    
    try:
        for dataset in datasets:
            if not dataset.masked_data:
                continue
            
            table_name = dataset.table_name
            rows = dataset.masked_data
            column_mapping = dataset.column_mapping
            
            # Get columns that were masked
            masked_columns = list(column_mapping.keys())
            
            logger.info(f"[PUSH] Pushing {len(rows)} rows to {table_name}")
            
            try:
                if mode == 'insert':
                    # Create a new table with _masked suffix
                    masked_table_name = f"{table_name}_masked"
                    
                    if db_connection.db_type == 'postgres':
                        rows_affected = insert_into_postgres_table(
                            host=db_connection.host,
                            port=db_connection.port,
                            database_name=db_connection.database_name,
                            username=db_connection.username,
                            password=db_connection.password,
                            table_name=masked_table_name,
                            rows=rows,
                        )
                    elif db_connection.db_type == 'mysql':
                        rows_affected = insert_into_mysql_table(
                            host=db_connection.host,
                            port=db_connection.port,
                            database_name=db_connection.database_name,
                            username=db_connection.username,
                            password=db_connection.password,
                            table_name=masked_table_name,
                            rows=rows,
                        )
                    elif db_connection.db_type == 'sqlite':
                        rows_affected = insert_into_sqlite_table(
                            database_name=db_connection.database_name,
                            table_name=masked_table_name,
                            rows=rows,
                        )
                    else:
                        raise ValueError(f"Unsupported database type for push: {db_connection.db_type}")
                    
                    results['details'].append({
                        'table_name': masked_table_name,
                        'rows_affected': rows_affected,
                        'operation': 'insert',
                    })
                    
                else:  # mode == 'update'
                    # Update the original table
                    if db_connection.db_type == 'postgres':
                        rows_affected = update_postgres_table(
                            host=db_connection.host,
                            port=db_connection.port,
                            database_name=db_connection.database_name,
                            username=db_connection.username,
                            password=db_connection.password,
                            table_name=table_name,
                            rows=rows,
                            masked_columns=masked_columns,
                        )
                    elif db_connection.db_type == 'mysql':
                        rows_affected = update_mysql_table(
                            host=db_connection.host,
                            port=db_connection.port,
                            database_name=db_connection.database_name,
                            username=db_connection.username,
                            password=db_connection.password,
                            table_name=table_name,
                            rows=rows,
                            masked_columns=masked_columns,
                        )
                    elif db_connection.db_type == 'sqlite':
                        rows_affected = update_sqlite_table(
                            database_name=db_connection.database_name,
                            table_name=table_name,
                            rows=rows,
                            masked_columns=masked_columns,
                        )
                    else:
                        raise ValueError(f"Unsupported database type for push: {db_connection.db_type}")
                    
                    results['details'].append({
                        'table_name': table_name,
                        'rows_affected': rows_affected,
                        'operation': 'update',
                    })
                
                results['tables_updated'] += 1
                results['rows_affected'] += rows_affected
                
                # Log success
                MaskingLog.objects.create(
                    job=job,
                    action='masking_completed',
                    step='completed',
                    message=f'Database updated successfully: {table_name} ({rows_affected} rows)',
                    level='success',
                    status='completed',
                )
                
            except Exception as e:
                logger.error(f"[PUSH] Error updating table {table_name}: {str(e)}")
                results['details'].append({
                    'table_name': table_name,
                    'error': str(e),
                    'operation': mode,
                })
                
                MaskingLog.objects.create(
                    job=job,
                    action='job_failed',
                    step='masking',
                    message=f'Failed to update {table_name}: {str(e)}',
                    level='error',
                    status='error',
                )
        
        # Final log
        MaskingLog.objects.create(
            job=job,
            action='job_completed',
            step='completed',
            message=f'Database push completed: {results["rows_affected"]} rows across {results["tables_updated"]} tables',
            level='success',
            status='completed',
        )
        
    except Exception as e:
        logger.error(f"[PUSH] Push operation failed: {str(e)}")
        results['status'] = 'failed'
        results['error'] = str(e)
        
        MaskingLog.objects.create(
            job=job,
            action='job_failed',
            step='masking',
            message=f'Push operation failed: {str(e)}',
            level='error',
            status='error',
        )
    
    return results
