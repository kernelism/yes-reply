"""
ICS (iCalendar) file generator for meeting invitations.
Generates .ics files that can be attached to emails for calendar integration.
"""

from datetime import datetime, timedelta
from typing import Optional
import uuid


def generate_ics_file(
    summary: str,
    start_datetime: datetime,
    duration_minutes: int,
    organizer_name: str,
    organizer_email: str,
    attendee_email: str,
    description: Optional[str] = None,
    location: Optional[str] = None,
    timezone: str = "UTC"
) -> str:
    """
    Generate an ICS (iCalendar) file content for a meeting invitation.
    
    Args:
        summary: Meeting title/subject
        start_datetime: Start date and time of the meeting
        duration_minutes: Duration of the meeting in minutes
        organizer_name: Name of the meeting organizer
        organizer_email: Email of the meeting organizer
        attendee_email: Email of the attendee
        description: Optional meeting description
        location: Optional meeting location
        timezone: Timezone (default: UTC)
        
    Returns:
        ICS file content as a string
    """
    # Calculate end time
    end_datetime = start_datetime + timedelta(minutes=duration_minutes)
    
    # Generate unique IDs
    uid = f"{uuid.uuid4()}@yesreply.tech"
    dtstamp = datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")
    
    # Format datetime in ICS format (YYYYMMDDTHHMMSSZ for UTC)
    dtstart = start_datetime.strftime("%Y%m%dT%H%M%SZ")
    dtend = end_datetime.strftime("%Y%m%dT%H%M%SZ")
    
    # Escape special characters in text fields
    def escape_ics_text(text: str) -> str:
        if not text:
            return ""
        return text.replace("\\", "\\\\").replace(",", "\\,").replace(";", "\\;").replace("\n", "\\n")
    
    # Build ICS content
    ics_content = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//YesReply//Meeting Scheduler//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:REQUEST",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{dtstamp}",
        f"DTSTART:{dtstart}",
        f"DTEND:{dtend}",
        f"SUMMARY:{escape_ics_text(summary)}",
        f"ORGANIZER;CN={escape_ics_text(organizer_name)}:MAILTO:{organizer_email}",
        f"ATTENDEE;CN={escape_ics_text(attendee_email)};RSVP=TRUE:MAILTO:{attendee_email}",
        "STATUS:CONFIRMED",
        "SEQUENCE:0",
    ]
    
    if description:
        ics_content.append(f"DESCRIPTION:{escape_ics_text(description)}")
    
    if location:
        ics_content.append(f"LOCATION:{escape_ics_text(location)}")
    
    ics_content.extend([
        "BEGIN:VALARM",
        "TRIGGER:-PT15M",
        "ACTION:DISPLAY",
        f"DESCRIPTION:Reminder: {escape_ics_text(summary)}",
        "END:VALARM",
        "END:VEVENT",
        "END:VCALENDAR"
    ])
    
    return "\r\n".join(ics_content)


def create_ics_attachment(
    summary: str,
    start_datetime: datetime,
    duration_minutes: int,
    organizer_name: str,
    organizer_email: str,
    attendee_email: str,
    description: Optional[str] = None,
    location: Optional[str] = None
) -> dict:
    """
    Create an ICS file attachment dictionary ready for email sending.
    
    Args:
        summary: Meeting title/subject
        start_datetime: Start date and time of the meeting
        duration_minutes: Duration of the meeting in minutes
        organizer_name: Name of the meeting organizer
        organizer_email: Email of the meeting organizer
        attendee_email: Email of the attendee
        description: Optional meeting description
        location: Optional meeting location
        
    Returns:
        Dictionary with attachment metadata including base64 encoded ICS file
    """
    import base64
    
    # Generate ICS content
    ics_content = generate_ics_file(
        summary=summary,
        start_datetime=start_datetime,
        duration_minutes=duration_minutes,
        organizer_name=organizer_name,
        organizer_email=organizer_email,
        attendee_email=attendee_email,
        description=description,
        location=location
    )
    
    # Encode to base64
    ics_bytes = ics_content.encode('utf-8')
    ics_base64 = base64.b64encode(ics_bytes).decode('utf-8')
    
    # Create filename with meeting title
    safe_summary = "".join(c for c in summary if c.isalnum() or c in (' ', '-', '_')).strip()[:50]
    filename = f"meeting_{safe_summary.replace(' ', '_')}.ics"
    
    return {
        "filename": filename,
        "content_type": "text/calendar; charset=utf-8; method=REQUEST",
        "data": ics_base64,
        "size": len(ics_bytes)
    }

