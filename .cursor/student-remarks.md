# Student Remarks/Notes Feature - Implementation Prompt

## Feature Overview
Implement a comprehensive Student Remarks/Notes tracking system for a School ERP where teachers, wardens, and staff can add, view, filter, and manage student behavior notes, incidents, and observations with automatic timestamps and categorization.

## User Roles & Access
- **Teachers**: Add remarks about academic performance, behavior, participation
- **Hostel Wardens**: Add remarks about hostel conduct, incidents, discipline
- **Staff**: View and manage remarks across their domain
- **Admin**: Full access to all remarks, analytics, reporting

**Note**: Parents have NO access to this system as of now. This is internal staff only.

---

## Database Schema

### StudentRemarks Table
```sql
CREATE TABLE student_remarks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  created_by_role VARCHAR(50) NOT NULL, -- 'teacher', 'warden', 'staff', 'admin'
  
  remark_type VARCHAR(50) NOT NULL, -- 'positive', 'negative', 'observation', 'incident'
  category VARCHAR(50) NOT NULL, -- 'behavior', 'academic', 'conduct', 'hostel', 'health', 'attendance', 'discipline'
  
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity VARCHAR(20), -- NULL, 'low', 'medium', 'high' (for negative remarks only)
  tags TEXT[], -- Array of tags like ['leader', 'shy', 'troublemaker', 'helpful']
  
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'resolved', 'archived'
  follow_up_note TEXT, -- For marking as resolved with notes
  
  is_flagged BOOLEAN DEFAULT false, -- Flag for principal/counselor review
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_remark_type CHECK (remark_type IN ('positive', 'negative', 'observation', 'incident')),
  CONSTRAINT valid_category CHECK (category IN ('behavior', 'academic', 'conduct', 'hostel', 'health', 'attendance', 'discipline')),
  CONSTRAINT valid_severity CHECK (severity IS NULL OR severity IN ('low', 'medium', 'high'))
);

CREATE INDEX idx_student_remarks_student_id ON student_remarks(student_id);
CREATE INDEX idx_student_remarks_created_by ON student_remarks(created_by_id);
CREATE INDEX idx_student_remarks_created_at ON student_remarks(created_at DESC);
CREATE INDEX idx_student_remarks_type ON student_remarks(remark_type);
CREATE INDEX idx_student_remarks_category ON student_remarks(category);
CREATE INDEX idx_student_remarks_status ON student_remarks(status);
```

---

## Backend API Endpoints

### 1. Create Remark
```
POST /api/remarks
Content-Type: application/json

{
  "student_id": "uuid",
  "remark_type": "positive|negative|observation|incident",
  "category": "behavior|academic|conduct|hostel|health|attendance|discipline",
  "title": "Brief subject line",
  "description": "Detailed remark text",
  "severity": "low|medium|high", // optional, only for negative remarks
  "tags": ["tag1", "tag2"], // optional array
  "is_flagged": false // optional, for escalation
}

Response: 201 Created
{
  "id": "uuid",
  "student_id": "uuid",
  "created_by_id": "uuid",
  "remark_type": "positive",
  "category": "academic",
  "title": "Excellent Math Performance",
  "description": "...",
  "created_at": "2024-06-30T14:30:00Z",
  "updated_at": "2024-06-30T14:30:00Z"
}
```

### 2. Get Remarks for Student
```
GET /api/remarks/student/:student_id?type=positive&category=academic&sort=newest&limit=50&offset=0

Query Parameters:
- type: 'positive|negative|observation|incident' (optional)
- category: 'behavior|academic|conduct|hostel|health|attendance|discipline' (optional)
- status: 'active|resolved|archived' (optional)
- sort: 'newest|oldest' (optional, default: newest)
- limit: number (default: 50)
- offset: number (default: 0)

Response: 200 OK
{
  "data": [
    {
      "id": "uuid",
      "student_id": "uuid",
      "created_by": {
        "id": "uuid",
        "name": "John Doe",
        "role": "teacher"
      },
      "remark_type": "positive",
      "category": "academic",
      "title": "Excellent Math Performance",
      "description": "Solved complex geometry problem on board perfectly",
      "tags": ["top-performer", "mathematics"],
      "severity": null,
      "status": "active",
      "created_at": "2024-06-30T14:30:00Z",
      "updated_at": "2024-06-30T14:30:00Z"
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### 3. Get Dashboard Stats
```
GET /api/remarks/dashboard/stats?days=7&class_id=uuid&created_by_id=uuid

Query Parameters:
- days: 7|30|90|365 (default: 7)
- class_id: filter by class (optional)
- created_by_id: filter by staff member (optional)

Response: 200 OK
{
  "total_remarks": 24,
  "positive_count": 16,
  "negative_count": 8,
  "observation_count": 4,
  "incident_count": 2,
  "by_category": {
    "behavior": 8,
    "academic": 6,
    "conduct": 4,
    "hostel": 6,
    "health": 0,
    "attendance": 0,
    "discipline": 2
  },
  "flagged_remarks": 2,
  "resolved_remarks": 3
}
```

### 4. Update Remark
```
PATCH /api/remarks/:remark_id
Content-Type: application/json

{
  "title": "Updated title", // optional
  "description": "Updated description", // optional
  "severity": "medium", // optional
  "tags": ["tag1", "tag2"], // optional
  "status": "resolved", // optional
  "follow_up_note": "Behavior improved after discussion" // optional
}

Response: 200 OK
{
  "id": "uuid",
  "updated_at": "2024-06-30T15:45:00Z",
  ...
}
```

### 5. Delete Remark (Soft Delete - Archive)
```
DELETE /api/remarks/:remark_id

Response: 200 OK
{
  "message": "Remark archived successfully",
  "id": "uuid",
  "status": "archived"
}
```

### 6. Search Remarks
```
GET /api/remarks/search?q=keyword&student_id=uuid&class_id=uuid&date_from=2024-06-01&date_to=2024-06-30

Query Parameters:
- q: search keyword in title/description (required)
- student_id: filter by student (optional)
- class_id: filter by class (optional)
- date_from: from date YYYY-MM-DD (optional)
- date_to: to date YYYY-MM-DD (optional)
- remark_type: filter by type (optional)
- category: filter by category (optional)

Response: 200 OK
{
  "data": [...],
  "total": 5
}
```

### 7. Get Class-wise Report
```
GET /api/remarks/class/:class_id/report?period=month

Query Parameters:
- period: 'week|month|quarter|semester' (default: month)

Response: 200 OK
{
  "class_id": "uuid",
  "class_name": "10-A",
  "period": "June 2024",
  "total_students": 45,
  "students_with_remarks": 32,
  "total_remarks": 156,
  "breakdown": {
    "positive": 98,
    "negative": 35,
    "observation": 18,
    "incident": 5
  },
  "top_performers": [...],
  "students_needing_attention": [...]
}
```

### 8. Flag/Escalate Remark
```
PATCH /api/remarks/:remark_id/escalate
Content-Type: application/json

{
  "is_flagged": true,
  "escalation_note": "Needs principal review"
}

Response: 200 OK
```

---

## Frontend Components & Pages

### 1. Remarks Dashboard Page (`/remarks` or `/dashboard/remarks`)
**Features:**
- Quick stats cards (This Week, Positive, Negative counts)
- Filter sidebar: Type, Category, Date Range, Creator (Staff Member)
- Recent remarks list/table with:
  - Student name
  - Remark title
  - Type badge (color-coded)
  - Category badge
  - Severity indicator (if negative)
  - Date & time
  - Action buttons (View, Edit, Delete, Flag)
- Pagination or infinite scroll

### 2. Add/Edit Remark Modal or Page
**Form Fields:**
- Student selector (autocomplete search by name/roll number)
- Remark Type dropdown (Positive, Negative, Observation, Incident)
- Category dropdown (Behavior, Academic, Conduct, Hostel, Health, Attendance, Discipline)
- Title input (text field)
- Description textarea (with character counter, min 10, max 1000)
- Tags input (multi-select or comma-separated)
- Severity dropdown (Low, Medium, High) - only show for negative remarks
- Flag for Review checkbox
- Save/Cancel buttons
- Auto-populated current user & timestamp on submit

### 3. Student Profile Remarks Tab
**Features:**
- Student info header with avatar, name, class, roll number
- Remarks timeline showing:
  - Type badge (color-coded)
  - Date & time
  - Remark title
  - Short preview of description
  - Tags
  - Expandable full view
- Filter by type/category
- Add New Remark button
- Export/Print option

### 4. Class Report Page (`/remarks/class/:class_id/report`)
**Features:**
- Class selector dropdown
- Date range picker (week, month, quarter, semester)
- Summary statistics:
  - Total remarks
  - Breakdown by type
  - Breakdown by category
- Top performers list (students with most positive remarks)
- Students needing attention (high severity negative remarks)
- Export to PDF button

### 5. Search & Filter Page (`/remarks/search`)
**Features:**
- Search bar (keyword in title/description)
- Advanced filters:
  - Student name/roll number
  - Class
  - Remark type
  - Category
  - Date range
  - Created by (staff member)
  - Status (Active, Resolved, Archived)
- Results table with sorting
- Bulk actions (Mark as Resolved, Archive, Delete)

### 6. Settings/Templates Page (`/remarks/settings`)
**Features:**
- Pre-defined remark templates:
  - Positive templates: "Good participation", "Excellent project submission", "Leadership shown"
  - Negative templates: "Missing assignments", "Late submission", "Disruptive behavior"
  - Hostel templates: "Noise complaint", "Late night activity", "Cleanliness issue"
- Add/Edit/Delete templates
- Default severity levels for each category
- Tag management and suggestions

---

## UI/UX Design Requirements

### Color Coding System
- **Positive**: Green (#059669)
- **Negative**: Red (#dc2626)
- **Observation**: Gray (#6b7280)
- **Incident**: Yellow/Amber (#f59e0b)

### Badge Design
- Type badges: Shows remark type with appropriate color
- Category badges: Shows category with neutral color
- Severity badges: Shows Low/Medium/High for negative remarks

### Icons
- Positive: ✓ (check)
- Negative: ⚠ (alert)
- Observation: 📝 (note)
- Incident: 🚨 (alert-circle)

### Responsive Design
- Desktop: Full sidebar filters, multi-column layout
- Tablet: Collapsible filters, 2-column layout
- Mobile: Stacked layout, filter drawer

---

## Validation Rules

**Client-side & Server-side:**
1. Student ID is required
2. Remark type must be one of: positive, negative, observation, incident
3. Category must be one of: behavior, academic, conduct, hostel, health, attendance, discipline
4. Title: required, 10-255 characters
5. Description: required, 10-1000 characters
6. Tags: optional, max 10 tags, each max 30 characters
7. Severity: required only if type is 'negative', must be low/medium/high
8. User creating remark must have appropriate role (teacher, warden, staff, admin)
9. Cannot create duplicate remarks within 5 minutes (prevent accidental duplicates)

---

## Business Logic

### Auto-Behaviors
1. **Timestamp**: All remarks auto-timestamped on creation
2. **User Info**: Automatically capture logged-in user ID and role
3. **Search Index**: Index remarks for full-text search
4. **Notifications**: (Optional) Notify class teacher if HIGH severity negative remark added
5. **Status Transition**: 
   - New remarks start as "active"
   - Can be marked "resolved" with follow-up note
   - Can be "archived" (soft delete)
6. **Duplicate Prevention**: Alert if similar remark within 5 minutes

### Permissions Matrix
| Action | Teacher | Warden | Staff | Admin |
|--------|---------|--------|-------|-------|
| Add Remark | ✓ (own class) | ✓ (own hostel) | ✓ (domain) | ✓ |
| Edit Own Remark | ✓ (within 24h) | ✓ (within 24h) | ✓ (within 24h) | ✓ |
| Delete Remark | ✗ | ✗ | ✗ | ✓ |
| View All Remarks | ✓ (own class) | ✓ (own hostel) | ✓ (domain) | ✓ |
| Flag/Escalate | ✓ | ✓ | ✓ | ✓ |
| Generate Report | ✓ (own class) | ✓ (own hostel) | ✓ (domain) | ✓ |
| Archive | ✓ (own) | ✓ (own) | ✓ (own) | ✓ |

---

## Features to Implement (in priority order)

### Phase 1 (MVP)
- [ ] Database schema & migrations
- [ ] Add Remark API endpoint
- [ ] Get Student Remarks API endpoint
- [ ] Remarks Dashboard page
- [ ] Add/Edit Remark form/modal
- [ ] Student profile remarks tab
- [ ] Basic filtering (type, category, date)

### Phase 2
- [ ] Search functionality
- [ ] Class report generation
- [ ] Edit & resolve remarks
- [ ] Flag for review
- [ ] Pagination/infinite scroll
- [ ] Export to PDF

### Phase 3
- [ ] Remark templates
- [ ] Analytics & insights
- [ ] Bulk operations
- [ ] Email notifications
- [ ] Advanced filtering & saved filters
- [ ] Activity audit log

---

## Testing Requirements

### Unit Tests
- Validation logic for all fields
- Permission checks
- Status transitions
- Duplicate prevention

### Integration Tests
- Full create/read/update/delete flow
- API response formats
- Database constraints
- Foreign key relationships

### E2E Tests
- Add remark flow for different user roles
- Filter and search functionality
- Report generation
- Edit and resolve remark workflow

---

## Performance Considerations

1. **Database Queries**:
   - Use indexes on student_id, created_by_id, created_at, remark_type, category
   - Pagination for remarks list (don't load all at once)
   - Lazy load user details for created_by

2. **Frontend**:
   - Lazy load remarks timeline (infinite scroll or pagination)
   - Debounce search input (300-500ms)
   - Memoize components to prevent re-renders
   - Virtual scrolling for large lists

3. **Caching**:
   - Cache dashboard stats (refresh every 5 minutes)
   - Cache student remarks (invalidate on new remark)
   - Cache templates

---

## Notes
- Use proper error handling and user-friendly error messages
- Add loading states and spinners during API calls
- Implement proper authentication/authorization checks
- Log all actions for audit trail
- Follow existing code style and conventions in the project
- Add proper TypeScript types for all data structures