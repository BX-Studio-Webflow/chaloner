export interface PersonResponse {
  person: Person;
  errors: any[];
}

export interface Person {
  id: number;
  name: string;
  profile_picture_thumb_url: string;
  profile_picture_original_url: string;
  description: string | null;
  emails: any[];
  phones: any[];
  job_profiles: any[];
  education_profiles: any[];
  documents: any[];
  resumes: any[];
  custom_text_1: string | null;
  custom_text_2: string | null;
  custom_text_3: string | null;
  custom_text_4: string | null;
  custom_text_5: string | null;
  custom_hierarchy_1: any[];
  custom_hierarchy_2: any[];
  custom_hierarchy_3: any[];
  custom_hierarchy_4: any[];
  custom_hierarchy_5: any[];
  custom_hierarchy_6: any[];
  candidate_jobs: any[];
  linkedin_url: string | null;
  person_global_status: string | null;
  all_raw_tags: string;
  agency_id: number;
  blocked: boolean;
  blocked_until: string | null;
  list_ids: any[];
  candidates: any[];
  skillsets: string | null;
  owned_by_id: number | null;
  compensation: number | null;
  compensation_notes: string | null;
  compensation_currency_id: number | null;
  salary: number | null;
  salary_type_id: number | null;
  target_salary: number | null;
  target_salary_type_id: number | null;
  bonus: number | null;
  equity: number | null;
  bonus_type_id: number | null;
  equity_type_id: number | null;
  bonus_payment_type_id: number | null;
  created_at: string;
  updated_at: string;
  created_by_id: number | null;
  updated_by_id: number | null;
  person_shares: any[];
  person_types: PersonType[];
  location: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  country: string | null;
  source_type: SourceType | null;
  diversity_types: any[];
}

export interface PersonType {
  id: number;
  key: string;
  name: string;
  default: boolean;
  position: number;
}

export interface SourceType {
  id: number;
  name: string;
}
