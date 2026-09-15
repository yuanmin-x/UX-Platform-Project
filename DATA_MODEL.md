# DATA_MODEL.md

## 1. MVP persistence approach

Use PostgreSQL / Supabase.

Do not use a dedicated graph database.

Core tables:
- projects
- objects
- project_objects
- relationships
- evidence_items
- project_members
- participants
- study_participants
- study_sessions
- recordings
- transcripts
- transcript_segments
- codes
- segment_codes
- tags
- segment_tags
- notes
- clips
- research_design_frames
- activity_events
- calendar_events
- files

Use JSONB selectively for type-specific metadata to avoid premature schema explosion.

## 2. projects

Suggested fields:
- id
- name
- description
- initial_business_problem_id
- created_by
- created_at
- updated_at

## 3. objects

Suggested fields:
- id
- type
- title
- description
- status
- owner_id
- metadata JSONB
- created_by
- created_at
- updated_at
- archived

Object types:
- business_problem
- research_question
- study
- dataset
- result
- insight
- recommendation

## 4. project_objects

Needed because one object may appear in multiple Projects.

Fields:
- project_id
- object_id
- x
- y
- width / height optional
- hidden
- custom_color optional
- created_at

## 5. relationships

Fields:
- id
- project_id
- source_object_id
- target_object_id
- label nullable
- created_by
- created_at

Direction is represented by source → target.

No semantic relationship enum required.

## 6. evidence_items

Evidence is not a top-level object, but needs persistent references.

Fields:
- id
- insight_id
- evidence_type
- source_id
- source_location JSONB
- preview
- created_by
- created_at

Important:
The same source evidence may be referenced by multiple Insights.
Do not model source ownership as exclusive.

## 7. participants

Fields:
- id
- participant_code
- display_name optional
- metadata JSONB
- segment
- notes
- created_at

## 8. study_participants

Fields:
- study_id
- participant_id
- status
- channel/source optional
- assigned_member_id optional
- metadata JSONB

## 9. study_sessions

Fields:
- id
- study_id
- participant_id nullable
- status
- scheduled_at
- started_at
- completed_at
- duration
- assigned_member_id
- metadata JSONB

For Survey, a "session" abstraction may not be used in UI; responses may be stored separately if needed. Do not force every study type into identical session semantics.

## 10. recordings

Fields:
- id
- session_id
- file_url/reference
- media_type
- duration
- created_at

## 11. transcripts

Fields:
- id
- session_id
- recording_id
- text / external reference
- language
- created_at

## 12. transcript_segments

Fields:
- id
- transcript_id
- start_time
- end_time
- speaker
- text
- highlighted boolean
- created_at

## 13. codes

Fields:
- id
- project_id or workspace scope
- name
- color
- description
- created_by

MVP can keep codes flat.

## 14. segment_codes

Many-to-many:
- segment_id
- code_id
- created_by
- created_at

## 15. tags / segment_tags

Tags remain lighter-weight than coding.

tags:
- id
- name
- category
- built_in boolean
- color

segment_tags:
- segment_id
- tag_id

## 16. notes

Fields:
- id
- source_type
- source_id
- author_id
- text
- created_at

## 17. clips

Fields:
- id
- recording_id
- session_id
- start_time
- end_time
- title
- created_by
- created_at

## 18. research_design_frames

Fields:
- id
- project_id
- title
- x
- y
- width
- height
- metadata JSONB

Frame membership may use:
- frame_objects(frame_id, object_id)

## 19. project_members

Fields:
- project_id
- user_id
- role: owner | lead | member | viewer

Permissions needed for MVP:
- edit
- finalize Insight
- project settings

## 20. Result metadata examples

ANOVA metadata:
```json
{
  "resultType": "anova",
  "fValue": 7.212,
  "pValue": 0.008,
  "df1": 1,
  "df2": 254
}
```

Theme result:
```json
{
  "resultType": "theme",
  "referenceCount": 12,
  "participantCount": 8
}
```

## 21. Insight status audit

For MVP, store:
- created_by
- validated_by
- finalized_by
- timestamps in metadata or dedicated columns

Do not build full event sourcing.
