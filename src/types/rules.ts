/* Rule is coming now the following way : {
    "data": "WITH mysql MYSQL_1 DO          \n    IF GET /api/videos2 THEN\n        rawQuery data: {\"query\": \"select * from videos_catalogue\"}\n    IF GET /api/adaptus2_reports THEN\n        log \"reports being queried\"\n    \n        \n        \n",
    "lock": true,
    "requestId": "1366d0cb-35f2-4afe-ae4d-de0bef4f6fe6"
} */


export interface Rule {
  data: string;
  lock: boolean;
  requestId: string;
}

export interface DSL {
  id?: string;
  data: string;
}

export interface Capability {
  actions: string[];
}

export interface ValidationResult {
  valid: boolean;
  ast?: any;
  errors?: string[];
}
