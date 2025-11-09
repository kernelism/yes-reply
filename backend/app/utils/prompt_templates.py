"""
Prompt templates for AI-powered features.
This module contains reusable prompt templates for various AI operations.
"""

from typing import List, Dict, Any


class EmailSummaryPromptTemplate:
    """
    Template for generating email thread summaries using AI.
    """
    
    BASE_PROMPT = """You are an expert email analyst. Analyze the following email thread containing {email_count} emails and provide a crisp, concise summary of the entire conversation.

Guidelines for the summary:
1. Maximum 5 lines - be extremely concise
2. Start with a brief subject or context phrase (e.g., "Project Update:", "Meeting Request:", "Action Required:") to provide immediate context
3. Use direct, first-person or second-person tone - avoid third person (no "they said", "the user mentioned", etc.)
4. Write as if you're directly addressing the reader or summarizing from their perspective
5. Make it smooth and natural - flow naturally from the context phrase to the key details
6. Identify the main topic and purpose of the entire thread
7. Highlight key decisions, action items, or outcomes across all emails
8. Note important dates, deadlines, or commitments mentioned
9. Focus on what matters most - skip pleasantries and filler
10. Show the progression of the conversation if relevant
11. Include any final decisions or conclusions reached
12. Keep it crisp and actionable

Email Thread ({email_count} emails in chronological order):
{thread_content}

Provide a crisp, direct summary in maximum 5 lines, starting with a brief context phrase:"""

    @staticmethod
    def format_email_content(
        email_index: int,
        total_emails: int,
        sender_name: str,
        sender_email: str,
        receiver_name: str,
        receiver_email: str,
        date: str,
        subject: str,
        body: str
    ) -> str:
        """
        Format a single email into a structured string for the prompt.
        
        Args:
            email_index: Index of the email in the thread (1-based)
            total_emails: Total number of emails in the thread
            sender_name: Name of the sender
            sender_email: Email address of the sender
            receiver_name: Name of the receiver
            receiver_email: Email address of the receiver
            date: Date and time of the email
            subject: Subject line of the email
            body: Body content of the email
            
        Returns:
            Formatted email string
        """
        return f"""
Email {email_index} of {total_emails}:
From: {sender_name} ({sender_email})
To: {receiver_name} ({receiver_email})
Date: {date}
Subject: {subject}
Body: {body}
"""

    @classmethod
    def build_thread_summary_prompt(
        cls,
        thread_emails: List[Dict[str, Any]]
    ) -> str:
        """
        Build a complete prompt for summarizing an email thread.
        
        Args:
            thread_emails: List of email dictionaries with keys:
                - sender_name, sender_email
                - receiver_name, receiver_email
                - created_at (datetime)
                - subject
                - body
                
        Returns:
            Complete formatted prompt string
        """
        total_emails = len(thread_emails)
        
        # Build thread content
        thread_content_parts = []
        for idx, email in enumerate(thread_emails, 1):
            email_content = cls.format_email_content(
                email_index=idx,
                total_emails=total_emails,
                sender_name=email.get('sender_name', 'Unknown'),
                sender_email=email.get('sender_email', 'Unknown'),
                receiver_name=email.get('receiver_name', 'Unknown'),
                receiver_email=email.get('receiver_email', 'Unknown'),
                date=email.get('date', 'Unknown date'),
                subject=email.get('subject', '(No subject)'),
                body=email.get('body', '(No content)')
            )
            thread_content_parts.append(email_content)
        
        thread_content = "\n".join(thread_content_parts)
        
        # Format the base prompt
        prompt = cls.BASE_PROMPT.format(
            email_count=total_emails,
            thread_content=thread_content
        )
        
        return prompt

    @classmethod
    def build_simple_summary_prompt(
        cls,
        thread_content: str,
        email_count: int
    ) -> str:
        """
        Build a prompt using pre-formatted thread content.
        Useful when thread content is already formatted.
        
        Args:
            thread_content: Pre-formatted string containing all emails
            email_count: Number of emails in the thread
            
        Returns:
            Complete formatted prompt string
        """
        return cls.BASE_PROMPT.format(
            email_count=email_count,
            thread_content=thread_content
        )

