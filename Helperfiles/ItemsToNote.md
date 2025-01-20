## Logo Management in GeneralSettings

### Implementation Details
- Location: 
  - Frontend: `app/sites/settings/GeneralSettings.tsx`
  - API: `app/api/settings/organization/[uid]/upload/route.ts`
- Storage Paths:
  - Logo: `/{OrgID}/logo/{OrgID}-logo.jpg`
  - Consent Forms: `/{OrgID}/consent-forms/{OrgID}Consent{1|2|3}.txt`
- Bucket: `DigiFile_Public`

### File Handling
1. **Logo Upload**
   - Handles image files
   - Stores as JPEG format
   - Updates preview immediately
   - Refreshes public URL after upload

2. **Consent Documents**
   - Handles text files
   - Stores in numbered format (consent1.txt, etc.)
   - Server-side validation
   - Separate view/upload functionality

### Button Types
- Submit button only for form submission
- View and Upload buttons set to type="button"
- Prevents unintended form submissions

### Security Considerations
1. **Server-side Upload**
   - Logo upload handled on server side
   - Uses service role key for Supabase operations
   - Validates organization ID against session
   - Prevents unauthorized access across organizations

2. **Error Handling**
   - Validates file presence
   - Checks organization permissions
   - Handles upload failures gracefully
   - Returns appropriate status codes

### Functionality
1. **Logo Display**
   - Fetches logo from Supabase using organization ID
   - Uses public URL for display
   - Falls back to placeholder if no logo exists

2. **Logo Upload**
   - Handles file selection and preview
   - Renames file to `{OrgID}-logo.jpg`
   - Uploads to Supabase on form submit
   - Uses upsert to replace existing logo

### Making Changes
To modify logo handling:
1. Update storage path in `fetchLogo` useEffect
2. Modify upload logic in `handleSubmit`
3. Adjust file type restrictions in input element
4. Update Supabase bucket name if needed

### Troubleshooting
1. **Image Loading Issues**
   - Use `unoptimized` prop on Next.js Image component
   - Add error handling to fall back to placeholder
   - Configure `remotePatterns` in next.config.js instead of `domains`

2. **Upload Issues**
   - Specify `contentType` in Supabase upload options
   - Refresh public URL after successful upload
   - Handle both upload and API response errors separately
   - Check network tab for detailed error responses

### Common Errors
1. **Empty Error Object**
   - Usually indicates a problem with the API response
   - Check network tab for actual response
   - Ensure proper error handling on both client and server
   - Verify organization ID is present in requests

### Related Files
- `app/sites/settings/GeneralSettings.tsx`
- `.env` (Supabase configuration)
- `next.config.js` (Image configuration)
- Supabase storage bucket configuration

### Storage Paths
- Logo: `/{OrgID}/logo/{OrgID}-logo.jpg`
- Consent Forms: `/{OrgID}/consent-forms/{OrgID}Consent{1|2|3}.txt`

### Consent Documents
1. **File Storage**
   - Stored as `{OrgID}Consent{1|2|3}.txt`
   - Server-side validation
   - Organization-specific paths
   - Text file format

2. **Viewing**
   - Modal display of content
   - Fetches content on demand
   - Server-side file retrieval
   - Error handling for missing files


### Session Management

1. **Session Structure**
   - Contains user identification and organization context
   - Includes role-based access control information
   - Available through auth() function server-side
   - Accessible via useSession() hook client-side

2. **Key Properties**
   - user.name: Full name from database
   - user.email: User's email address
   - user.orgId: Organization identifier
   - user.roles: Array of role objects
     - role.uid: Role unique identifier
     - role.name: Role name (e.g., "admin", "organizer")

3. **Role-Based Access**
   - Admin role: Full system access
   - Organizer role: Organization management
   - Regular users: Limited to own data
   - Role checks should use toLowerCase() for comparison

4. **Security Considerations**
   - Session includes orgId for multi-tenant separation
   - Roles determine UI element visibility
   - Server-side validation required despite client roles
   - Session timeout set to 30 minutes

5. **Usage Examples**
   ```typescript
   // Server-side
   const session = await auth()
   const orgId = session?.user?.orgId
   
   // Client-side
   const { data: session } = useSession()
   const isAdmin = session?.user?.roles?.some(r => 
     r.role.name.toLowerCase() === 'admin'
   )
   ```

6. **Implementation Files**
   - app/lib/auth.ts: Core authentication logic
   - app/hooks/use-session.ts: Client-side hook
   - app/types/next-auth.d.ts: Type definitions
   - app/lib/config.ts: Session configuration

### Settings Page Structure

1. **Components**
   - `settings/page.tsx`: Main settings layout with tabs
   - `settings/GeneralSettings.tsx`: Organization settings
   - `settings/UserSettings.tsx`: User management
   - `settings/DebitOrderSettings.tsx`: Debit order configuration

2. **Role-Based Access Control**
   - **Admin/Organizer Access**
     - Full access to all settings tabs
     - Can view and modify General Settings
     - Can manage User Settings and roles
     - Can access Debit Order Settings
   - **Regular User Access**
     - Limited to User Settings tab only
     - Can only edit their own user profile
     - Cannot view or modify organization settings
     - Cannot access debit order settings

3. **Tab Management**
   - Default tab selection based on user role
   - Admin/Organizer: defaults to "general"
   - Regular users: defaults to "users"
   - Conditional tab rendering prevents unauthorized access

4. **Implementation Details**
   ```typescript
   const hasAdminAccess = session?.user?.roles?.some(r => 
     r.role.name.toLowerCase() === 'admin' || 
     r.role.name.toLowerCase() === 'organizer'
   )
   ```
   - Used consistently across settings components
   - Controls both UI visibility and access
   - Applied at both tab and content levels

5. **Security Considerations**
   - Client-side role checks for UI rendering
   - Server-side validation required for all actions
   - Consistent role checking methodology
   - Protected API routes for sensitive operations

6. **User Settings Access Levels**
   - **Admin/Organizer**
     - Can view and edit all users
     - Can manage user roles
     - Full access to role management card
   - **Regular Users**
     - Can only view own profile
     - Can edit basic profile information
     - Cannot view or modify roles
     - Cannot access other users' data

7. **Best Practices**
   - Use `hasAdminAccess` helper consistently
   - Apply role checks at multiple levels
   - Maintain server-side validation
   - Keep UI clean and role-appropriate
   - Handle unauthorized access gracefully

8. **Related Components**
   - Tabs from shadcn/ui
   - Custom role-based buttons
   - Protected API routes
   - Session management integration

9. **Common Patterns**
   - Early role checks in components
   - Conditional rendering based on roles
   - Consistent access control helpers
   - Clear separation of admin/user functions

10. **Error Handling**
    - Graceful degradation for unauthorized access
    - Clear user feedback
    - Proper error boundaries
    - Role-appropriate error messages

### Calendar Access Control

1. **Role-Based Calendar Access**
   - **Admin/Organizer Access**
     - Can view all users' calendars
     - Full access to calendar management
     - Can add/edit appointments for any user
   - **Regular Users**
     - Can only view their own calendar
     - Limited to managing own appointments
     - Cannot access other users' calendars

2. **Implementation Details**
   ```typescript
   const hasAdminAccess = session?.user?.roles?.some(r => 
     r.role.name.toLowerCase() === 'admin' || 
     r.role.name.toLowerCase() === 'organizer'
   )
   ```
   - Used consistently in calendar components
   - Controls both UI visibility and data access
   - Applied at both client and server levels

3. **Security Implementation**
   - **Client-side**
     - Role checks for UI rendering
     - Filtered calendar view based on roles
     - Conditional rendering of admin features
   - **Server-side**
     - Session validation
     - Role-based data filtering
     - Organization-scoped queries
     - Protected API endpoints

4. **Data Access Patterns**
   - Admin/Organizer: All organization calendars
   - Regular users: Only personal calendar
   - Organization-scoped queries
   - Active user filtering

5. **Best Practices**
   - Consistent role checking methodology
   - Multi-level access control
   - Server-side validation for all actions
   - Clean UI separation based on roles
   - Proper error handling for unauthorized access

6. **Related Components**
   - Calendar page component
   - Calendar API routes
   - Appointment management
   - Session integration
   - Role-based UI elements

7. **Common Patterns**
   - Early role validation
   - Conditional data fetching
   - Consistent access helpers
   - Clear separation of admin/user views

8. **Error Handling**
   - Unauthorized access handling
   - Data fetch failures
   - Role-appropriate error messages
   - Graceful UI degradation