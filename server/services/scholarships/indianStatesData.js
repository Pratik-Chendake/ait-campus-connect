/**
 * Comprehensive Directory of All 28 Indian States & 8 Union Territories
 * Includes official government portal URLs and verified out-of-state study policies
 * for students attending Army Institute of Technology (AIT) in Pune, Maharashtra.
 */

export const INDIAN_STATES_AND_UTS = [
  // --- 28 STATES ---
  {
    code: 'AP',
    name: 'Andhra Pradesh',
    type: 'STATE',
    portal_name: 'Jnanabhumi / Jagananna Vidya Deevena Portal',
    portal_url: 'https://jnanabhumi.ap.gov.in/',
    outside_state_study_allowed: false,
    ait_compatibility_status: 'RESTRICTED',
    compatibility_notes: 'Jagananna Vidya Deevena fee reimbursement is strictly restricted to institutions affiliated with state universities within Andhra Pradesh. AIT Pune students are advised to apply via NSP Central Sector Scheme.'
  },
  {
    code: 'AR',
    name: 'Arunachal Pradesh',
    type: 'STATE',
    portal_name: 'Arunachal Pradesh State Scholarship Portal',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'APST (Arunachal Pradesh Scheduled Tribe) students studying engineering at recognized AICTE institutes outside the state (including AIT Pune) are eligible for Post-Matric Scholarship disbursed via NSP.'
  },
  {
    code: 'AS',
    name: 'Assam',
    type: 'STATE',
    portal_name: 'Directorate of Higher Education / Gyan Deepika',
    portal_url: 'https://dhe-operations.assam.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Assam Post-Matric and Combined Merit Scholarships for SC/ST/OBC permit undergraduate study in AICTE-approved institutions outside Assam subject to institutional bonafide.'
  },
  {
    code: 'BR',
    name: 'Bihar',
    type: 'STATE',
    portal_name: 'Bihar Post-Matric Scholarship Portal (PMS Online)',
    portal_url: 'https://pmsonline.bih.nic.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Bihar PMS Online allows BC/EBC/SC/ST students pursuing engineering at recognized autonomous colleges outside Bihar (such as AIT Pune) to receive tuition reimbursement with institute verification.'
  },
  {
    code: 'CG',
    name: 'Chhattisgarh',
    type: 'STATE',
    portal_name: 'Chhattisgarh State Scholarship Portal',
    portal_url: 'https://postmatric-scholarship.cg.nic.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Post-Matric scholarship scheme for SC/ST/OBC domiciled in Chhattisgarh supports engineering degree studies in recognized colleges outside the state.'
  },
  {
    code: 'GA',
    name: 'Goa',
    type: 'STATE',
    portal_name: 'Goa Directorate of Higher Education',
    portal_url: 'https://dhe.goa.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Fee Concession Scheme and Bursary Scheme of Goa support Goan students pursuing professional technical courses in AICTE-recognized colleges across India.'
  },
  {
    code: 'GJ',
    name: 'Gujarat',
    type: 'STATE',
    portal_name: 'Digital Gujarat Scholarship Portal',
    portal_url: 'https://www.digitalgujarat.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Digital Gujarat Post-Matric schemes allow SC/ST/SEBC students studying outside Gujarat in AICTE-approved colleges (AIT Pune) to apply with out-of-state verification.'
  },
  {
    code: 'HR',
    name: 'Haryana',
    type: 'STATE',
    portal_name: 'Har-Chhatravratti Portal (Haryana Higher Education)',
    portal_url: 'https://harchhatravratti.highereduhry.ac.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Haryana Post-Matric Scholarship for SC/BC and Merit-cum-Means schemes permit eligible Haryana domicile students to study outside Haryana.'
  },
  {
    code: 'HP',
    name: 'Himachal Pradesh',
    type: 'STATE',
    portal_name: 'HP e-Pass / National Scholarship Portal',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Himachal Pradesh Kalpana Chawla, Dr. Ambedkar, and Post-Matric schemes support professional degree students in AICTE institutes across India through NSP.'
  },
  {
    code: 'JH',
    name: 'Jharkhand',
    type: 'STATE',
    portal_name: 'e-Kalyan Jharkhand Portal',
    portal_url: 'https://ekalyan.cgg.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'e-Kalyan Jharkhand accepts applications from SC/ST/BC students studying in recognized engineering institutions outside the state with institutional verification certificate.'
  },
  {
    code: 'KA',
    name: 'Karnataka',
    type: 'STATE',
    portal_name: 'State Scholarship Portal (SSP Karnataka)',
    portal_url: 'https://ssp.postmatric.karnataka.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Karnataka SSP Post-Matric scheme supports Karnataka students admitted to AICTE-approved engineering institutions outside Karnataka (under Other State Institutions category).'
  },
  {
    code: 'KL',
    name: 'Kerala',
    type: 'STATE',
    portal_name: 'e-Grantz Kerala / DCE Scholarship Portal',
    portal_url: 'https://egrantz.kerala.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'e-Grantz 3.0 supports SC/ST/OEC/OBC students of Kerala studying professional degree courses in recognized institutions outside Kerala.'
  },
  {
    code: 'MP',
    name: 'Madhya Pradesh',
    type: 'STATE',
    portal_name: 'MP State Scholarship Portal 2.0 (MPTAAS)',
    portal_url: 'https://www.tribal.mp.gov.in/mptaas',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'MPTAAS Post-Matric scheme for SC/ST/OBC and Medhavi Chhatra Yojana support study outside Madhya Pradesh in AICTE-recognized engineering colleges.'
  },
  {
    code: 'MH',
    name: 'Maharashtra',
    type: 'STATE',
    portal_name: 'MahaDBT (Aaple Sarkar DBT Portal)',
    portal_url: 'https://mahadbt.maharashtra.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'HOST_STATE',
    compatibility_notes: 'Host State of AIT Pune! Maharashtra domicile students admitted via CAP are eligible for Rajarshi Shahu EBC and Dr. Panjabrao Deshmukh hostel support.'
  },
  {
    code: 'MN',
    name: 'Manipur',
    type: 'STATE',
    portal_name: 'Manipur State Scholarship Portal',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Manipur Post-Matric Scholarship for ST/SC/OBC is disbursed through NSP and covers studies in recognized engineering colleges across India.'
  },
  {
    code: 'ML',
    name: 'Meghalaya',
    type: 'STATE',
    portal_name: 'Meghalaya State Portal / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Meghalaya Post-Matric Scholarship for ST students permits undergraduate engineering study outside the state in AICTE/UGC recognized colleges.'
  },
  {
    code: 'MZ',
    name: 'Mizoram',
    type: 'STATE',
    portal_name: 'Mizoram Scholarship Board / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Post-Matric ST Scholarship and Merit-cum-Means schemes administered via NSP accept AIT Pune undergraduate students.'
  },
  {
    code: 'NL',
    name: 'Nagaland',
    type: 'STATE',
    portal_name: 'Nagaland State Scholarship Portal',
    portal_url: 'https://scholarship.nagaland.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Nagaland Post-Matric and State Merit Scholarship schemes permit Indigenous Naga students to study in AICTE-recognized colleges outside Nagaland.'
  },
  {
    code: 'OD',
    name: 'Odisha',
    type: 'STATE',
    portal_name: 'Odisha State Scholarship Portal',
    portal_url: 'https://scholarship.odisha.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Odisha Post-Matric and Biju Yuba Sashaktikaran schemes support students studying engineering courses in AICTE-recognized institutions outside Odisha.'
  },
  {
    code: 'PB',
    name: 'Punjab',
    type: 'STATE',
    portal_name: 'Dr. Ambedkar Scholarship Portal (Punjab)',
    portal_url: 'https://scholarships.punjab.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Dr. Ambedkar Post-Matric Scholarship scheme supports SC/BC students of Punjab studying professional courses outside Punjab with out-of-state verification.'
  },
  {
    code: 'RJ',
    name: 'Rajasthan',
    type: 'STATE',
    portal_name: 'Social Justice and Empowerment (SJMS Rajasthan)',
    portal_url: 'https://sjms.rajasthan.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Rajasthan Uttar Matric Scholarship allows SC/ST/SBC/OBC/EBC students studying B.Tech at recognized institutions outside Rajasthan to receive fee support.'
  },
  {
    code: 'SK',
    name: 'Sikkim',
    type: 'STATE',
    portal_name: 'Sikkim State Scholarship Portal / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Sikkim State Post-Matric Scholarship supports Sikkimese students pursuing engineering degrees outside the state via NSP.'
  },
  {
    code: 'TN',
    name: 'Tamil Nadu',
    type: 'STATE',
    portal_name: 'Tamil Nadu Adi Dravidar & Tribal Welfare Portal',
    portal_url: 'https://escholarship.tn.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Post-Matric Scholarship for SC/ST students of Tamil Nadu permits studies in premier AICTE-recognized technical colleges outside Tamil Nadu.'
  },
  {
    code: 'TS',
    name: 'Telangana',
    type: 'STATE',
    portal_name: 'Telangana ePASS (Electronic Payment & Application System)',
    portal_url: 'https://telanganaepass.cgg.gov.in/',
    outside_state_study_allowed: false,
    ait_compatibility_status: 'RESTRICTED',
    compatibility_notes: 'Telangana ePASS RTF (Reimbursement of Tuition Fee) is generally restricted to TS colleges. However, Central Sector NSP schemes remain available to Telangana students.'
  },
  {
    code: 'TR',
    name: 'Tripura',
    type: 'STATE',
    portal_name: 'Tripura State Portal / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Tripura Post-Matric Scholarship for SC/ST/OBC students supports professional engineering degree studies outside the state through NSP.'
  },
  {
    code: 'UP',
    name: 'Uttar Pradesh',
    type: 'STATE',
    portal_name: 'UP Scholarship and Fee Reimbursement Portal',
    portal_url: 'https://scholarship.up.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'UP Post-Matric Other State Scheme allows Uttar Pradesh domicile students enrolled in recognized engineering colleges outside UP (like AIT Pune) to receive tuition reimbursement.'
  },
  {
    code: 'UK',
    name: 'Uttarakhand',
    type: 'STATE',
    portal_name: 'Uttarakhand State Scholarship Portal / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Uttarakhand Post-Matric Scholarship for SC/ST/OBC supports technical degree studies outside Uttarakhand in AICTE-approved institutions via NSP.'
  },
  {
    code: 'WB',
    name: 'West Bengal',
    type: 'STATE',
    portal_name: 'Swami Vivekananda Merit-cum-Means (SVMCM) / Oasis',
    portal_url: 'https://svmcm.wbhed.gov.in/',
    outside_state_study_allowed: false,
    ait_compatibility_status: 'RESTRICTED',
    compatibility_notes: 'SVMCM is predominantly restricted to institutions within West Bengal. WB students studying at AIT Pune are eligible for NSP Central Sector and KSB/ESSA schemes.'
  },

  // --- 8 UNION TERRITORIES ---
  {
    code: 'AN',
    name: 'Andaman and Nicobar Islands',
    type: 'UT',
    portal_name: 'Andaman & Nicobar Higher Education Portal / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'A&N Administration provides financial assistance and travel allowance for island students pursuing professional degrees in mainland institutions like AIT Pune.'
  },
  {
    code: 'CH',
    name: 'Chandigarh',
    type: 'UT',
    portal_name: 'Chandigarh Education Department / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Chandigarh UT Post-Matric schemes administered through NSP permit students to study in AICTE-approved colleges in Maharashtra.'
  },
  {
    code: 'DN',
    name: 'Dadra & Nagar Haveli and Daman & Diu',
    type: 'UT',
    portal_name: 'DNH & DD Administration Scholarship / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'UT administration provides post-matric financial support for SC/ST/OBC students studying technical courses in Western Region institutes including Pune.'
  },
  {
    code: 'DL',
    name: 'Delhi',
    type: 'UT',
    portal_name: 'e-District Delhi Portal (Higher Education Schemes)',
    portal_url: 'https://edistrict.delhigovt.nic.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Delhi Post-Matric SC/ST/OBC scheme and Merit Scholarship for Ex-Servicemen wards support recognized professional degree education across India.'
  },
  {
    code: 'JK',
    name: 'Jammu and Kashmir',
    type: 'UT',
    portal_name: 'AICTE PMSSS (Prime Minister’s Special Scholarship Scheme for J&K and Ladakh)',
    portal_url: 'https://www.aicte-india.org/bureaus/jk',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Special Scheme! AICTE PMSSS specifically funds J&K and Ladakh students admitted to supernumerary engineering seats across India, covering full tuition fee up to ₹1.25 Lakhs and ₹1.0 Lakh maintenance.'
  },
  {
    code: 'LA',
    name: 'Ladakh',
    type: 'UT',
    portal_name: 'Ladakh Administration / AICTE PMSSS',
    portal_url: 'https://www.aicte-india.org/bureaus/jk',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Ladakh ST and PMSSS students are funded for undergraduate engineering studies in mainland institutions with full hostel and maintenance support.'
  },
  {
    code: 'LD',
    name: 'Lakshadweep',
    type: 'UT',
    portal_name: 'Lakshadweep Education Department / NSP',
    portal_url: 'https://scholarships.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Lakshadweep ST Higher Education assistance fully funds mainland engineering education in recognized colleges including tuition and travel.'
  },
  {
    code: 'PY',
    name: 'Puducherry',
    type: 'UT',
    portal_name: 'Perunthalaivar Kamarajar Financial Assistance Scheme (PKFAS)',
    portal_url: 'https://dhte.py.gov.in/',
    outside_state_study_allowed: true,
    ait_compatibility_status: 'COMPATIBLE',
    compatibility_notes: 'Puducherry administration provides assistance for professional degree studies in AICTE-approved institutions with domicile verification.'
  }
];
