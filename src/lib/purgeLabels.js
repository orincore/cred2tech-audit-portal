// Human-readable labels for the purge_events ledger, sourced from the field
// map in Cred2Tech/backend's src/services/purge/dataRetentionPurge.service.js
// (PURGE_FIELD_MAP). Non-technical readers (auditors, compliance) shouldn't
// have to decode raw table/column names to understand what was deleted.

const TABLE_LABELS = {
  bureau_verifications: 'Credit Bureau Check',
  gstr_analytics_requests: 'GST Return Analysis',
  itr_analytics_requests: 'Income Tax Return (ITR) Analysis',
  bank_statement_analysis_requests: 'Bank Statement Analysis',
};

const FIELD_LABELS = {
  // bureau_verifications
  raw_response: 'Raw bureau report',
  score: 'Credit score',
  emi_obligations_total: 'Total EMI obligations',

  // gstr_analytics_requests
  raw_fetch_data: 'Raw GST data (fetch)',
  raw_report_data: 'Raw GST data (report)',
  raw_gst_data: 'Raw GST data',
  provider_callback_payload: 'Provider callback data',
  callback_payload: 'Callback data',
  report_json_url: 'Analysis report (JSON file)',
  report_excel_url: 'Analysis report (Excel file)',
  report_pdf_url: 'Analysis report (PDF file)',
  turnover_latest_year: 'Turnover figure — latest year',
  turnover_previous_year: 'Turnover figure — previous year',
  avg_monthly_turnover: 'Average monthly turnover',
  months_filed_12m: 'Months filed (last 12 months)',
  nil_return_months: 'Nil-return months count',
  selected_turnover_latest_fy: 'Selected turnover — latest financial year',
  selected_turnover_previous_fy: 'Selected turnover — previous financial year',
  selected_turnover_source: 'Turnover data source',
  rolling_12_month_turnover: 'Rolling 12-month turnover',
  rolling_12_month_end_period: 'Rolling 12-month period end date',
  financial_year_latest: 'Latest financial year on record',
  financial_year_previous: 'Previous financial year on record',

  // itr_analytics_requests
  analytics_payload: 'Raw ITR analysis data',
  net_profit_latest_year: 'Net profit — latest year',
  net_profit_previous_year: 'Net profit — previous year',
  gross_receipts_latest_year: 'Gross receipts — latest year',
  gross_receipts_previous_year: 'Gross receipts — previous year',

  // bank_statement_analysis_requests
  files_payload: 'Uploaded bank statement files',
  raw_analyze_response: 'Raw bank analysis data',
  raw_retrieve_response: 'Raw bank retrieval data',
  raw_download_response: 'Raw bank download data',
  avg_bank_balance_latest_year: 'Average bank balance — latest year',
  avg_bank_balance_previous_year: 'Average bank balance — previous year',
};

function prettifyFallback(raw) {
  return String(raw || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function friendlyTableName(table) {
  return TABLE_LABELS[table] || prettifyFallback(table);
}

function friendlyFieldLabel(field) {
  return FIELD_LABELS[field] || prettifyFallback(field);
}

module.exports = { friendlyTableName, friendlyFieldLabel, TABLE_LABELS, FIELD_LABELS };
