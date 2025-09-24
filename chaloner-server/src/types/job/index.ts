export interface JobResponse {
  id: number;
  agency: Agency;
  title: string;
  published_name: string;
  macro_address: string;
  description: string;
  company_hidden: boolean;
  company: Company;
  address: null;
  city: string;
  state_code: string;
  zip: null;
  country_code: string;
  owners: Owner[];
  contacts: Contact[];
  salary: string;
  salary_min: string;
  salary_max: string;
  salary_type_id: number;
  salary_currency_id: number;
  job_type: Agency;
  status: Agency;
  categories: any[];
  category: null;
  documents: any[];
  custom_hierarchy_1: any[];
  custom_numeric_range_1: null;
  custom_date_range_1: null;
  custom_text_1: null;
  custom_text_2: null;
  custom_hierarchy_2: CustomHierarchy2[];
  custom_text_3: null;
  custom_text_4: null;
  custom_text_5: null;
  custom_text_6: null;
  custom_text_7: null;
  custom_text_8: null;
  custom_text_9: null;
  custom_text_10: null;
  custom_text_11: null;
  custom_text_12: null;
  custom_text_13: null;
  custom_text_14: null;
  custom_text_15: null;
  custom_text_16: null;
  custom_text_17: null;
  custom_text_18: null;
  custom_text_19: null;
  custom_text_20: null;
  custom_text_21: null;
  custom_text_22: null;
  custom_text_23: null;
  custom_text_24: null;
  custom_text_25: null;
  custom_text_26: null;
  custom_text_27: null;
  custom_text_28: null;
  custom_text_29: null;
  custom_text_30: null;
  custom_text_31: null;
  custom_text_32: null;
  custom_text_33: null;
  custom_text_34: null;
  custom_text_35: null;
  custom_text_36: null;
  custom_text_37: null;
  custom_text_38: null;
  custom_text_39: null;
  custom_text_40: null;
  custom_text_41: null;
  custom_text_42: null;
  custom_text_43: null;
  custom_text_44: null;
  custom_hierarchy_3: any[];
  custom_text_45: null;
  custom_text_46: null;
  custom_text_47: null;
  custom_text_48: null;
  custom_text_49: null;
  description_text: string;
  public_url: string;
  internal_notes: null;
  counts: Count[];
  created_at: Date;
  published: boolean;
  published_at: Date;
  bonus: null;
  bonus_payment_type_id: number;
  bonus_type_id: number;
  equity: null;
  equity_percent: null;
  equity_type_id: number;
  bill_rate: null;
  bill_rate_type_id: null;
  bill_rate_currency_id: null;
  pay_rate: null;
  pay_rate_type_id: null;
  pay_rate_currency_id: null;
  fee: string;
  fee_type_id: number;
  fee_currency_id: number;
  filled_at: null;
  rank: number;
  fee_type: FeeType;
  seniority_levels: any[];
  has_cadences: boolean;
  opened_at: Date;
  published_end_date: null;
  remote_work_allowed: boolean;
  apply_form_template_id: null;
}

export interface Agency {
  id: number;
  name: string;
}

export interface Company {
  id: number;
  name: string;
  logo_large_url: string;
  logo_thumb_url: string;
}

export interface Contact {
  id: number;
  position: number;
  profile_picture_thumb_url: string;
  name: string;
  title: string;
  person_id: number;
  emails: Email[];
  phones: any[];
  job_contact_type_id: number;
}

export interface Email {
  id: number;
  value: string;
  email_type_id: number;
}

export interface Count {
  id: number;
  name: string;
  count: number;
}

export interface CustomHierarchy2 {
  id: number;
  value: string;
}

export interface FeeType {
  id: number;
  key: string;
  name: string;
}

export interface Owner {
  id: number;
  position: number;
  name: string;
  email: string;
  phone: null;
  user_id: number;
  avatar_thumb_url: string;
  avatar_original_url: string;
  job_owner_type_id: number;
}
