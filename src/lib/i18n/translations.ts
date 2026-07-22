/**
 * Internationalization (i18n) Configuration
 * Multi-language support for Fluentive CRM
 */

export type Language = 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ja' | 'zh' | 'ko' | 'ar' | 'he' | 'fa' | 'ur';

export interface TranslationKeys {
  // Common
  common: {
    save: string;
    cancel: string;
    delete: string;
    edit: string;
    create: string;
    update: string;
    search: string;
    filter: string;
    loading: string;
    error: string;
    success: string;
    warning: string;
    info: string;
    yes: string;
    no: string;
    ok: string;
    back: string;
    next: string;
    previous: string;
    submit: string;
    reset: string;
    clear: string;
    close: string;
    open: string;
    view: string;
    download: string;
    upload: string;
    export: string;
    import: string;
    refresh: string;
    settings: string;
    help: string;
    about: string;
    logout: string;
    login: string;
    register: string;
    profile: string;
    dashboard: string;
    home: string;
  };

  // Navigation
  navigation: {
    dashboard: string;
    leads: string;
    deals: string;
    activities: string;
    reports: string;
    settings: string;
    users: string;
    analytics: string;
    ai_insights: string;
    notifications: string;
    admin: string;
  };

  // Authentication
  auth: {
    login: string;
    logout: string;
    register: string;
    forgot_password: string;
    reset_password: string;
    change_password: string;
    two_factor: string;
    remember_me: string;
    login_success: string;
    login_error: string;
    register_success: string;
    register_error: string;
    password_changed: string;
    password_error: string;
    invalid_credentials: string;
    account_locked: string;
    session_expired: string;
  };

  // Leads
  leads: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    list: string;
    details: string;
    name: string;
    email: string;
    phone: string;
    company: string;
    status: string;
    source: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
    notes: string;
    activities: string;
    deals: string;
    score: string;
    conversion_probability: string;
    last_contact: string;
    next_follow_up: string;
    add_note: string;
    schedule_activity: string;
    create_deal: string;
    mark_converted: string;
    mark_lost: string;
    bulk_actions: string;
    import_leads: string;
    export_leads: string;
    search_leads: string;
    filter_leads: string;
    sort_by: string;
    no_leads: string;
    lead_created: string;
    lead_updated: string;
    lead_deleted: string;
  };

  // Deals
  deals: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    list: string;
    details: string;
    name: string;
    value: string;
    stage: string;
    probability: string;
    expected_close: string;
    lead: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
    activities: string;
    notes: string;
    products: string;
    competitors: string;
    next_steps: string;
    add_note: string;
    schedule_activity: string;
    update_stage: string;
    mark_won: string;
    mark_lost: string;
    bulk_actions: string;
    import_deals: string;
    export_deals: string;
    search_deals: string;
    filter_deals: string;
    sort_by: string;
    no_deals: string;
    deal_created: string;
    deal_updated: string;
    deal_deleted: string;
    pipeline: string;
    forecast: string;
  };

  // Activities
  activities: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    list: string;
    details: string;
    type: string;
    subject: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    outcome: string;
    lead: string;
    deal: string;
    assigned_to: string;
    created_at: string;
    updated_at: string;
    notes: string;
    attachments: string;
    schedule_activity: string;
    complete_activity: string;
    reschedule_activity: string;
    cancel_activity: string;
    bulk_actions: string;
    import_activities: string;
    export_activities: string;
    search_activities: string;
    filter_activities: string;
    sort_by: string;
    no_activities: string;
    activity_created: string;
    activity_updated: string;
    activity_deleted: string;
    activity_completed: string;
    types: {
      call: string;
      email: string;
      meeting: string;
      task: string;
      note: string;
      demo: string;
      follow_up: string;
    };
  };

  // Reports
  reports: {
    title: string;
    generate: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    list: string;
    details: string;
    name: string;
    type: string;
    format: string;
    date_range: string;
    created_at: string;
    updated_at: string;
    download: string;
    email: string;
    schedule: string;
    parameters: string;
    results: string;
    charts: string;
    tables: string;
    summary: string;
    detailed: string;
    executive: string;
    custom: string;
    sales_pipeline: string;
    lead_conversion: string;
    revenue: string;
    activity_summary: string;
    user_performance: string;
    forecast: string;
    trends: string;
    comparisons: string;
    no_reports: string;
    report_created: string;
    report_updated: string;
    report_deleted: string;
    report_generated: string;
  };

  // Analytics
  analytics: {
    title: string;
    overview: string;
    dashboard: string;
    metrics: string;
    kpis: string;
    trends: string;
    comparisons: string;
    forecasts: string;
    real_time: string;
    historical: string;
    custom: string;
    export: string;
    share: string;
    embed: string;
    date_range: string;
    filters: string;
    groups: string;
    chart_type: string;
    data_source: string;
    refresh_rate: string;
    no_data: string;
    loading_data: string;
    error_loading: string;
  };

  // AI Insights
  ai: {
    title: string;
    insights: string;
    predictions: string;
    recommendations: string;
    lead_scoring: string;
    churn_prediction: string;
    sales_forecasting: string;
    behavioral_analysis: string;
    sentiment_analysis: string;
    opportunity_detection: string;
    risk_assessment: string;
    model_training: string;
    accuracy: string;
    confidence: string;
    probability: string;
    score: string;
    risk_level: string;
    action_required: string;
    auto_actions: string;
    manual_review: string;
    learn_more: string;
    settings: string;
    enable: string;
    disable: string;
    train_model: string;
    evaluate_model: string;
    export_model: string;
    import_model: string;
  };

  // Notifications
  notifications: {
    title: string;
    create: string;
    edit: string;
    delete: string;
    view: string;
    list: string;
    details: string;
    type: string;
    message: string;
    priority: string;
    read: string;
    unread: string;
    mark_read: string;
    mark_unread: string;
    mark_all_read: string;
    send: string;
    schedule: string;
    recipients: string;
    channels: string;
    email: string;
    sms: string;
    push: string;
    in_app: string;
    templates: string;
    preferences: string;
    settings: string;
    no_notifications: string;
    notification_sent: string;
    notification_read: string;
    real_time: string;
    batch: string;
    triggered: string;
    scheduled: string,
  };

  // Admin
  admin: {
    title: string;
    dashboard: string;
    users: string;
    roles: string;
    permissions: string;
    settings: string;
    configuration: string;
    integrations: string;
    backups: string;
    logs: string;
    security: string;
    audit: string;
    monitoring: string;
    performance: string;
    storage: string;
    api_keys: string;
    webhooks: string;
    automation: string;
    workflows: string;
    templates: string;
    themes: string;
    branding: string;
    localization: string;
    maintenance: string;
    system_info: string;
    health_check: string;
  };

  // Settings
  settings: {
    title: string;
    profile: string;
    account: string;
    preferences: string;
    notifications: string;
    privacy: string;
    security: string;
    billing: string;
    subscription: string;
    usage: string;
    limits: string;
    api: string;
    integrations: string,
    appearance: string;
    language: string;
    timezone: string;
    date_format: string;
    time_format: string;
    currency: string;
    number_format: string;
    theme: string;
    layout: string;
    accessibility: string;
    keyboard_shortcuts: string;
    export_data: string;
    delete_account: string;
    two_factor: string;
    password: string;
    email: string;
    phone: string;
    address: string;
    company: string;
    job_title: string;
    bio: string;
    avatar: string;
    signature: string;
  };

  // Errors
  errors: {
    generic: string;
    network: string;
    server: string;
    validation: string;
    authentication: string;
    authorization: string;
    not_found: string;
    conflict: string;
    timeout: string;
    rate_limit: string;
    quota_exceeded: string;
    file_too_large: string;
    invalid_format: string;
    missing_required: string;
    invalid_email: string;
    invalid_phone: string;
    weak_password: string;
    password_mismatch: string;
    email_exists: string;
    user_not_found: string;
    invalid_token: string;
    expired_token: string;
    session_invalid: string;
    account_locked: string;
    account_suspended: string;
    maintenance_mode: string;
    feature_disabled: string;
    permission_denied: string;
    data_corruption: string;
    backup_failed: string;
    restore_failed: string;
    import_failed: string;
    export_failed: string;
  };

  // Success Messages
  success: {
    saved: string;
    created: string;
    updated: string;
    deleted: string;
    uploaded: string;
    downloaded: string;
    imported: string;
    exported: string;
    sent: string;
    scheduled: string;
    completed: string;
    processed: string;
    synced: string;
    backed_up: string;
    restored: string;
    trained: string;
    deployed: string;
    published: string;
    archived: string;
    copied: string;
    moved: string;
    renamed: string;
    enabled: string;
    disabled: string;
    approved: string;
    rejected: string;
    accepted: string;
    confirmed: string;
    verified: string;
    authenticated: string;
    authorized: string;
    logged_in: string;
    logged_out: string;
    registered: string;
    subscribed: string;
    unsubscribed: string;
  };

  // Validation
  validation: {
    required: string;
    email: string;
    phone: string;
    url: string;
    number: string;
    date: string;
    time: string;
    min_length: string;
    max_length: string;
    min_value: string;
    max_value: string;
    pattern: string;
    unique: string;
    confirmed: string;
    accepted: string;
    file_type: string;
    file_size: string;
    image_format: string;
    video_format: string;
    audio_format: string;
    document_format: string;
  };

  // Time
  time: {
    now: string;
    today: string;
    yesterday: string;
    tomorrow: string;
    this_week: string;
    last_week: string;
    next_week: string;
    this_month: string;
    last_month: string;
    next_month: string;
    this_year: string;
    last_year: string;
    next_year: string;
    custom: string;
    ago: string;
    from_now: string;
    in: string;
    at: string;
    on: string;
    seconds: string;
    minutes: string;
    hours: string;
    days: string;
    weeks: string;
    months: string;
    years: string;
    second: string;
    minute: string;
    hour: string;
    day: string;
    week: string;
    month: string;
    year: string;
  };

  // Numbers
  numbers: {
    zero: string;
    one: string;
    two: string;
    three: string;
    four: string;
    five: string;
    six: string;
    seven: string;
    eight: string;
    nine: string;
    ten: string;
    hundred: string;
    thousand: string;
    million: string;
    billion: string;
    trillion: string;
  };

  // Currency
  currency: {
    usd: string;
    eur: string;
    gbp: string;
    jpy: string;
    cny: string;
    krw: string;
    inr: string;
    brl: string;
    cad: string;
    aud: string;
    chf: string;
    sek: string;
    nok: string;
    dkk: string;
    pln: string;
    rub: string;
    mxn: string;
    ars: string;
    clp: string;
    cop: string;
    pen: string;
    uyu: string;
    ves: string;
  };
}

// English translations (default)
export const en: TranslationKeys = {
  common: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    search: 'Search',
    filter: 'Filter',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    warning: 'Warning',
    info: 'Info',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    submit: 'Submit',
    reset: 'Reset',
    clear: 'Clear',
    close: 'Close',
    open: 'Open',
    view: 'View',
    download: 'Download',
    upload: 'Upload',
    export: 'Export',
    import: 'Import',
    refresh: 'Refresh',
    settings: 'Settings',
    help: 'Help',
    about: 'About',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
    profile: 'Profile',
    dashboard: 'Dashboard',
    home: 'Home',
  },

  navigation: {
    dashboard: 'Dashboard',
    leads: 'Leads',
    deals: 'Deals',
    activities: 'Activities',
    reports: 'Reports',
    settings: 'Settings',
    users: 'Users',
    analytics: 'Analytics',
    ai_insights: 'AI Insights',
    notifications: 'Notifications',
    admin: 'Admin',
  },

  auth: {
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    forgot_password: 'Forgot Password',
    reset_password: 'Reset Password',
    change_password: 'Change Password',
    two_factor: 'Two-Factor Authentication',
    remember_me: 'Remember Me',
    login_success: 'Login successful',
    login_error: 'Login failed',
    register_success: 'Registration successful',
    register_error: 'Registration failed',
    password_changed: 'Password changed successfully',
    password_error: 'Password change failed',
    invalid_credentials: 'Invalid credentials',
    account_locked: 'Account locked',
    session_expired: 'Session expired',
  },

  leads: {
    title: 'Leads',
    create: 'Create Lead',
    edit: 'Edit Lead',
    delete: 'Delete Lead',
    view: 'View Lead',
    list: 'Lead List',
    details: 'Lead Details',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    company: 'Company',
    status: 'Status',
    source: 'Source',
    assigned_to: 'Assigned To',
    created_at: 'Created At',
    updated_at: 'Updated At',
    notes: 'Notes',
    activities: 'Activities',
    deals: 'Deals',
    score: 'Score',
    conversion_probability: 'Conversion Probability',
    last_contact: 'Last Contact',
    next_follow_up: 'Next Follow Up',
    add_note: 'Add Note',
    schedule_activity: 'Schedule Activity',
    create_deal: 'Create Deal',
    mark_converted: 'Mark Converted',
    mark_lost: 'Mark Lost',
    bulk_actions: 'Bulk Actions',
    import_leads: 'Import Leads',
    export_leads: 'Export Leads',
    search_leads: 'Search Leads',
    filter_leads: 'Filter Leads',
    sort_by: 'Sort By',
    no_leads: 'No leads found',
    lead_created: 'Lead created successfully',
    lead_updated: 'Lead updated successfully',
    lead_deleted: 'Lead deleted successfully',
  },

  deals: {
    title: 'Deals',
    create: 'Create Deal',
    edit: 'Edit Deal',
    delete: 'Delete Deal',
    view: 'View Deal',
    list: 'Deal List',
    details: 'Deal Details',
    name: 'Name',
    value: 'Value',
    stage: 'Stage',
    probability: 'Probability',
    expected_close: 'Expected Close',
    lead: 'Lead',
    assigned_to: 'Assigned To',
    created_at: 'Created At',
    updated_at: 'Updated At',
    activities: 'Activities',
    notes: 'Notes',
    products: 'Products',
    competitors: 'Competitors',
    next_steps: 'Next Steps',
    add_note: 'Add Note',
    schedule_activity: 'Schedule Activity',
    update_stage: 'Update Stage',
    mark_won: 'Mark Won',
    mark_lost: 'Mark Lost',
    bulk_actions: 'Bulk Actions',
    import_deals: 'Import Deals',
    export_deals: 'Export Deals',
    search_deals: 'Search Deals',
    filter_deals: 'Filter Deals',
    sort_by: 'Sort By',
    no_deals: 'No deals found',
    deal_created: 'Deal created successfully',
    deal_updated: 'Deal updated successfully',
    deal_deleted: 'Deal deleted successfully',
    pipeline: 'Pipeline',
    forecast: 'Forecast',
  },

  activities: {
    title: 'Activities',
    create: 'Create Activity',
    edit: 'Edit Activity',
    delete: 'Delete Activity',
    view: 'View Activity',
    list: 'Activity List',
    details: 'Activity Details',
    type: 'Type',
    subject: 'Subject',
    description: 'Description',
    date: 'Date',
    time: 'Time',
    duration: 'Duration',
    outcome: 'Outcome',
    lead: 'Lead',
    deal: 'Deal',
    assigned_to: 'Assigned To',
    created_at: 'Created At',
    updated_at: 'Updated At',
    notes: 'Notes',
    attachments: 'Attachments',
    schedule_activity: 'Schedule Activity',
    complete_activity: 'Complete Activity',
    reschedule_activity: 'Reschedule Activity',
    cancel_activity: 'Cancel Activity',
    bulk_actions: 'Bulk Actions',
    import_activities: 'Import Activities',
    export_activities: 'Export Activities',
    search_activities: 'Search Activities',
    filter_activities: 'Filter Activities',
    sort_by: 'Sort By',
    no_activities: 'No activities found',
    activity_created: 'Activity created successfully',
    activity_updated: 'Activity updated successfully',
    activity_deleted: 'Activity deleted successfully',
    activity_completed: 'Activity completed successfully',
    types: {
      call: 'Call',
      email: 'Email',
      meeting: 'Meeting',
      task: 'Task',
      note: 'Note',
      demo: 'Demo',
      follow_up: 'Follow Up',
    },
  },

  reports: {
    title: 'Reports',
    generate: 'Generate Report',
    create: 'Create Report',
    edit: 'Edit Report',
    delete: 'Delete Report',
    view: 'View Report',
    list: 'Report List',
    details: 'Report Details',
    name: 'Name',
    type: 'Type',
    format: 'Format',
    date_range: 'Date Range',
    created_at: 'Created At',
    updated_at: 'Updated At',
    download: 'Download',
    email: 'Email',
    schedule: 'Schedule',
    parameters: 'Parameters',
    results: 'Results',
    charts: 'Charts',
    tables: 'Tables',
    summary: 'Summary',
    detailed: 'Detailed',
    executive: 'Executive',
    custom: 'Custom',
    sales_pipeline: 'Sales Pipeline',
    lead_conversion: 'Lead Conversion',
    revenue: 'Revenue',
    activity_summary: 'Activity Summary',
    user_performance: 'User Performance',
    forecast: 'Forecast',
    trends: 'Trends',
    comparisons: 'Comparisons',
    no_reports: 'No reports found',
    report_created: 'Report created successfully',
    report_updated: 'Report updated successfully',
    report_deleted: 'Report deleted successfully',
    report_generated: 'Report generated successfully',
  },

  analytics: {
    title: 'Analytics',
    overview: 'Overview',
    dashboard: 'Dashboard',
    metrics: 'Metrics',
    kpis: 'KPIs',
    trends: 'Trends',
    comparisons: 'Comparisons',
    forecasts: 'Forecasts',
    real_time: 'Real-time',
    historical: 'Historical',
    custom: 'Custom',
    export: 'Export',
    share: 'Share',
    embed: 'Embed',
    date_range: 'Date Range',
    filters: 'Filters',
    groups: 'Groups',
    chart_type: 'Chart Type',
    data_source: 'Data Source',
    refresh_rate: 'Refresh Rate',
    no_data: 'No data available',
    loading_data: 'Loading data...',
    error_loading: 'Error loading data',
  },

  ai: {
    title: 'AI Insights',
    insights: 'Insights',
    predictions: 'Predictions',
    recommendations: 'Recommendations',
    lead_scoring: 'Lead Scoring',
    churn_prediction: 'Churn Prediction',
    sales_forecasting: 'Sales Forecasting',
    behavioral_analysis: 'Behavioral Analysis',
    sentiment_analysis: 'Sentiment Analysis',
    opportunity_detection: 'Opportunity Detection',
    risk_assessment: 'Risk Assessment',
    model_training: 'Model Training',
    accuracy: 'Accuracy',
    confidence: 'Confidence',
    probability: 'Probability',
    score: 'Score',
    risk_level: 'Risk Level',
    action_required: 'Action Required',
    auto_actions: 'Auto Actions',
    manual_review: 'Manual Review',
    learn_more: 'Learn More',
    settings: 'Settings',
    enable: 'Enable',
    disable: 'Disable',
    train_model: 'Train Model',
    evaluate_model: 'Evaluate Model',
    export_model: 'Export Model',
    import_model: 'Import Model',
  },

  notifications: {
    title: 'Notifications',
    create: 'Create Notification',
    edit: 'Edit Notification',
    delete: 'Delete Notification',
    view: 'View Notification',
    list: 'Notification List',
    details: 'Notification Details',
    type: 'Type',
    message: 'Message',
    priority: 'Priority',
    read: 'Read',
    unread: 'Unread',
    mark_read: 'Mark as Read',
    mark_unread: 'Mark as Unread',
    mark_all_read: 'Mark All as Read',
    send: 'Send',
    schedule: 'Schedule',
    recipients: 'Recipients',
    channels: 'Channels',
    email: 'Email',
    sms: 'SMS',
    push: 'Push',
    in_app: 'In-App',
    templates: 'Templates',
    preferences: 'Preferences',
    settings: 'Settings',
    no_notifications: 'No notifications found',
    notification_sent: 'Notification sent successfully',
    notification_read: 'Notification marked as read',
    real_time: 'Real-time',
    batch: 'Batch',
    triggered: 'Triggered',
    scheduled: 'Scheduled',
  },

  admin: {
    title: 'Admin',
    dashboard: 'Dashboard',
    users: 'Users',
    roles: 'Roles',
    permissions: 'Permissions',
    settings: 'Settings',
    configuration: 'Configuration',
    integrations: 'Integrations',
    backups: 'Backups',
    logs: 'Logs',
    security: 'Security',
    audit: 'Audit',
    monitoring: 'Monitoring',
    performance: 'Performance',
    storage: 'Storage',
    api_keys: 'API Keys',
    webhooks: 'Webhooks',
    automation: 'Automation',
    workflows: 'Workflows',
    templates: 'Templates',
    themes: 'Themes',
    branding: 'Branding',
    localization: 'Localization',
    maintenance: 'Maintenance',
    system_info: 'System Info',
    health_check: 'Health Check',
  },

  settings: {
    title: 'Settings',
    profile: 'Profile',
    account: 'Account',
    preferences: 'Preferences',
    notifications: 'Notifications',
    privacy: 'Privacy',
    security: 'Security',
    billing: 'Billing',
    subscription: 'Subscription',
    usage: 'Usage',
    limits: 'Limits',
    api: 'API',
    integrations: 'Integrations',
    appearance: 'Appearance',
    language: 'Language',
    timezone: 'Timezone',
    date_format: 'Date Format',
    time_format: 'Time Format',
    currency: 'Currency',
    number_format: 'Number Format',
    theme: 'Theme',
    layout: 'Layout',
    accessibility: 'Accessibility',
    keyboard_shortcuts: 'Keyboard Shortcuts',
    export_data: 'Export Data',
    delete_account: 'Delete Account',
    two_factor: 'Two-Factor Authentication',
    password: 'Password',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    company: 'Company',
    job_title: 'Job Title',
    bio: 'Bio',
    avatar: 'Avatar',
    signature: 'Signature',
  },

  errors: {
    generic: 'An error occurred',
    network: 'Network error',
    server: 'Server error',
    validation: 'Validation error',
    authentication: 'Authentication error',
    authorization: 'Authorization error',
    not_found: 'Not found',
    conflict: 'Conflict',
    timeout: 'Request timeout',
    rate_limit: 'Rate limit exceeded',
    quota_exceeded: 'Quota exceeded',
    file_too_large: 'File too large',
    invalid_format: 'Invalid format',
    missing_required: 'Required field missing',
    invalid_email: 'Invalid email address',
    invalid_phone: 'Invalid phone number',
    weak_password: 'Password too weak',
    password_mismatch: 'Passwords do not match',
    email_exists: 'Email already exists',
    user_not_found: 'User not found',
    invalid_token: 'Invalid token',
    expired_token: 'Token expired',
    session_invalid: 'Invalid session',
    account_locked: 'Account locked',
    account_suspended: 'Account suspended',
    maintenance_mode: 'System under maintenance',
    feature_disabled: 'Feature disabled',
    permission_denied: 'Permission denied',
    data_corruption: 'Data corruption detected',
    backup_failed: 'Backup failed',
    restore_failed: 'Restore failed',
    import_failed: 'Import failed',
    export_failed: 'Export failed',
  },

  success: {
    saved: 'Saved successfully',
    created: 'Created successfully',
    updated: 'Updated successfully',
    deleted: 'Deleted successfully',
    uploaded: 'Uploaded successfully',
    downloaded: 'Downloaded successfully',
    imported: 'Imported successfully',
    exported: 'Exported successfully',
    sent: 'Sent successfully',
    scheduled: 'Scheduled successfully',
    completed: 'Completed successfully',
    processed: 'Processed successfully',
    synced: 'Synced successfully',
    backed_up: 'Backed up successfully',
    restored: 'Restored successfully',
    trained: 'Model trained successfully',
    deployed: 'Deployed successfully',
    published: 'Published successfully',
    archived: 'Archived successfully',
    copied: 'Copied successfully',
    moved: 'Moved successfully',
    renamed: 'Renamed successfully',
    enabled: 'Enabled successfully',
    disabled: 'Disabled successfully',
    approved: 'Approved successfully',
    rejected: 'Rejected successfully',
    accepted: 'Accepted successfully',
    confirmed: 'Confirmed successfully',
    verified: 'Verified successfully',
    authenticated: 'Authenticated successfully',
    authorized: 'Authorized successfully',
    logged_in: 'Logged in successfully',
    logged_out: 'Logged out successfully',
    registered: 'Registered successfully',
    subscribed: 'Subscribed successfully',
    unsubscribed: 'Unsubscribed successfully',
  },

  validation: {
    required: 'This field is required',
    email: 'Please enter a valid email address',
    phone: 'Please enter a valid phone number',
    url: 'Please enter a valid URL',
    number: 'Please enter a valid number',
    date: 'Please enter a valid date',
    time: 'Please enter a valid time',
    min_length: 'Minimum length is {{count}} characters',
    max_length: 'Maximum length is {{count}} characters',
    min_value: 'Minimum value is {{value}}',
    max_value: 'Maximum value is {{value}}',
    pattern: 'Please match the required pattern',
    unique: 'This value must be unique',
    confirmed: 'Please confirm this field',
    accepted: 'You must accept this field',
    file_type: 'Invalid file type',
    file_size: 'File size too large',
    image_format: 'Invalid image format',
    video_format: 'Invalid video format',
    audio_format: 'Invalid audio format',
    document_format: 'Invalid document format',
  },

  time: {
    now: 'Now',
    today: 'Today',
    yesterday: 'Yesterday',
    tomorrow: 'Tomorrow',
    this_week: 'This Week',
    last_week: 'Last Week',
    next_week: 'Next Week',
    this_month: 'This Month',
    last_month: 'Last Month',
    next_month: 'Next Month',
    this_year: 'This Year',
    last_year: 'Last Year',
    next_year: 'Next Year',
    custom: 'Custom',
    ago: '{{count}} {{unit}} ago',
    from_now: '{{count}} {{unit}} from now',
    in: 'in {{count}} {{unit}}',
    at: 'at {{time}}',
    on: 'on {{date}}',
    seconds: 'seconds',
    minutes: 'minutes',
    hours: 'hours',
    days: 'days',
    weeks: 'weeks',
    months: 'months',
    years: 'years',
    second: 'second',
    minute: 'minute',
    hour: 'hour',
    day: 'day',
    week: 'week',
    month: 'month',
    year: 'year',
  },

  numbers: {
    zero: 'Zero',
    one: 'One',
    two: 'Two',
    three: 'Three',
    four: 'Four',
    five: 'Five',
    six: 'Six',
    seven: 'Seven',
    eight: 'Eight',
    nine: 'Nine',
    ten: 'Ten',
    hundred: 'Hundred',
    thousand: 'Thousand',
    million: 'Million',
    billion: 'Billion',
    trillion: 'Trillion',
  },

  currency: {
    usd: 'US Dollar',
    eur: 'Euro',
    gbp: 'British Pound',
    jpy: 'Japanese Yen',
    cny: 'Chinese Yuan',
    krw: 'Korean Won',
    inr: 'Indian Rupee',
    brl: 'Brazilian Real',
    cad: 'Canadian Dollar',
    aud: 'Australian Dollar',
    chf: 'Swiss Franc',
    sek: 'Swedish Krona',
    nok: 'Norwegian Krone',
    dkk: 'Danish Krone',
    pln: 'Polish Zloty',
    rub: 'Russian Ruble',
    mxn: 'Mexican Peso',
    ars: 'Argentine Peso',
    clp: 'Chilean Peso',
    cop: 'Colombian Peso',
    pen: 'Peruvian Sol',
    uyu: 'Uruguayan Peso',
    ves: 'Venezuelan Bolívar',
  },
};

// Spanish translations
export const es: TranslationKeys = {
  ...en,
  common: {
    ...en.common,
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    edit: 'Editar',
    create: 'Crear',
    update: 'Actualizar',
    search: 'Buscar',
    filter: 'Filtrar',
    loading: 'Cargando...',
    error: 'Error',
    success: 'Éxito',
    warning: 'Advertencia',
    info: 'Información',
    yes: 'Sí',
    no: 'No',
    ok: 'OK',
    back: 'Atrás',
    next: 'Siguiente',
    previous: 'Anterior',
    submit: 'Enviar',
    reset: 'Restablecer',
    clear: 'Limpiar',
    close: 'Cerrar',
    open: 'Abrir',
    view: 'Ver',
    download: 'Descargar',
    upload: 'Subir',
    export: 'Exportar',
    import: 'Importar',
    refresh: 'Actualizar',
    settings: 'Configuración',
    help: 'Ayuda',
    about: 'Acerca de',
    logout: 'Cerrar sesión',
    login: 'Iniciar sesión',
    register: 'Registrarse',
    profile: 'Perfil',
    dashboard: 'Panel',
    home: 'Inicio',
  },

  navigation: {
    ...en.navigation,
    dashboard: 'Panel',
    leads: 'Clientes potenciales',
    deals: 'Acuerdos',
    activities: 'Actividades',
    reports: 'Informes',
    settings: 'Configuración',
    users: 'Usuarios',
    analytics: 'Análisis',
    ai_insights: 'Perspectivas de IA',
    notifications: 'Notificaciones',
    admin: 'Administrador',
  },

  // Add more Spanish translations as needed...
};

// French translations
export const fr: TranslationKeys = {
  ...en,
  common: {
    ...en.common,
    save: 'Enregistrer',
    cancel: 'Annuler',
    delete: 'Supprimer',
    edit: 'Modifier',
    create: 'Créer',
    update: 'Mettre à jour',
    search: 'Rechercher',
    filter: 'Filtrer',
    loading: 'Chargement...',
    error: 'Erreur',
    success: 'Succès',
    warning: 'Avertissement',
    info: 'Information',
    yes: 'Oui',
    no: 'Non',
    ok: 'OK',
    back: 'Retour',
    next: 'Suivant',
    previous: 'Précédent',
    submit: 'Soumettre',
    reset: 'Réinitialiser',
    clear: 'Effacer',
    close: 'Fermer',
    open: 'Ouvrir',
    view: 'Voir',
    download: 'Télécharger',
    upload: 'Téléverser',
    export: 'Exporter',
    import: 'Importer',
    refresh: 'Actualiser',
    settings: 'Paramètres',
    help: 'Aide',
    about: 'À propos',
    logout: 'Déconnexion',
    login: 'Connexion',
    register: "S'inscrire",
    profile: 'Profil',
    dashboard: 'Tableau de bord',
    home: 'Accueil',
  },

  navigation: {
    ...en.navigation,
    dashboard: 'Tableau de bord',
    leads: 'Pistes',
    deals: 'Affaires',
    activities: 'Activités',
    reports: 'Rapports',
    settings: 'Paramètres',
    users: 'Utilisateurs',
    analytics: 'Analytique',
    ai_insights: 'Perspectives IA',
    notifications: 'Notifications',
    admin: 'Admin',
  },
};

// Translation registry
export const translations: Record<Language, TranslationKeys> = {
  en,
  es,
  fr,
  // Add more languages as needed
  de: en, // German (fallback to English)
  it: en, // Italian (fallback to English)
  pt: en, // Portuguese (fallback to English)
  ja: en, // Japanese (fallback to English)
  zh: en, // Chinese (fallback to English)
  ko: en, // Korean (fallback to English)
  ar: en,
  he: en,
  fa: en,
  ur: en,
};

// Default language
export const defaultLanguage: Language = 'en';

// Supported languages
/** Same keys as `translations` — single source of truth for supported UI languages. */
export const supportedLanguages = Object.keys(translations) as Language[];

// Helper functions
export function getTranslation(language: Language = defaultLanguage): TranslationKeys {
  return translations[language] || translations[defaultLanguage];
}

export function isLanguageSupported(language: string): language is Language {
  return supportedLanguages.includes(language as Language);
}

export function getLanguageFromLocale(locale: string): Language {
  // Extract language code from locale (e.g., 'en-US' -> 'en')
  const langCode = locale.split('-')[0] as Language;
  return isLanguageSupported(langCode) ? langCode : defaultLanguage;
}

// Hook for getting translations (for React components)
export function useTranslations(language?: Language) {
  const currentLanguage = language || defaultLanguage;
  const t = getTranslation(currentLanguage);
  
  return {
    t,
    language: currentLanguage,
    isRTL: false, // Add RTL language support here
    formatDate: (date: Date, options?: Intl.DateTimeFormatOptions) => {
      return new Intl.DateTimeFormat(currentLanguage, options).format(date);
    },
    formatNumber: (number: number, options?: Intl.NumberFormatOptions) => {
      return new Intl.NumberFormat(currentLanguage, options).format(number);
    },
    formatCurrency: (amount: number, currency: string = 'USD') => {
      return new Intl.NumberFormat(currentLanguage, {
        style: 'currency',
        currency,
      }).format(amount);
    },
  };
}
