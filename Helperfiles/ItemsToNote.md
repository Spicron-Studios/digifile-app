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
