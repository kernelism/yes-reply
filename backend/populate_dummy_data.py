"""
Script to populate sophisticated dummy data for YesReply testing.
Creates realistic users, emails with payments, transactions, and notifications.
"""

import sys
import uuid
import json
from datetime import datetime, timedelta
from decimal import Decimal
from sqlalchemy.orm import Session

# Add parent directory to path to import app modules
sys.path.append('.')

from app.db.session import SessionLocal
from app.db.models import (
    User, Email, EmailStatus, Transaction, TransactionType, TransactionStatus,
    Payment, Notification, NotificationType, Cashout, CashoutStatus
)
from app.core.security import get_password_hash


def create_sophisticated_users(db: Session):
    """Create sophisticated, domain-relevant user profiles."""
    
    test_users = [
        {
            "id": str(uuid.uuid4()),
            "email": "sarah.martinez@techventures.com",
            "username": "sarahm",
            "first_name": "Sarah",
            "last_name": "Martinez",
            "description": "Venture Capitalist specializing in early-stage SaaS companies",
            "password": "password123",
            
            # Professional profile
            "job_title": "General Partner",
            "company": "TechVentures Capital",
            "location": "San Francisco, CA",
            "industry": "Venture Capital & Private Equity",
            "bio": "15+ years investing in B2B SaaS. Led investments in 40+ companies with 8 successful exits. Passionate about helping founders scale from seed to Series B. Previously VP at Sequoia Capital.",
            "expertise": "SaaS, B2B, Enterprise Software, Go-to-Market Strategy",
            "looking_for": json.dumps(["Investment opportunities", "Board advisory roles", "Founder introductions"]),
            
            # Social links
            "linkedin_profile_url": "https://linkedin.com/in/sarahmartinez",
            "twitter_url": "https://twitter.com/sarahm_vc",
            "website_url": "https://techventures.com/team/sarah-martinez",
            "calendly_url": "https://calendly.com/sarahm/30min",
            
            # Verification and limits
            "linkedin_verified": True,
            "price_limit": 5.0,
            "wallet_balance": Decimal("245.50"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "david.park@innovate.io",
            "username": "davidpark",
            "first_name": "David",
            "last_name": "Park",
            "description": "Serial Entrepreneur & Product Leader",
            "password": "password123",
            
            "job_title": "Founder & CEO",
            "company": "Innovate Labs",
            "location": "New York, NY",
            "industry": "Technology & Software",
            "bio": "Building the future of work. Previously founded 2 companies (1 acquired by Salesforce). Product lead at Dropbox. Love connecting with builders and investors.",
            "expertise": "Product Management, SaaS Growth, Team Building",
            "looking_for": json.dumps(["Partnership opportunities", "Investor intros", "Hiring senior engineers"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/davidpark",
            "twitter_url": "https://twitter.com/dpark",
            "website_url": "https://innovatelabs.io",
            "calendly_url": "https://calendly.com/davidpark/intro",
            
            "linkedin_verified": True,
            "price_limit": 4.0,
            "wallet_balance": Decimal("478.25"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "michelle.chen@growth.marketing",
            "username": "michellechen",
            "first_name": "Michelle",
            "last_name": "Chen",
            "description": "Growth Marketing Expert - Scaled 3 companies to $100M ARR",
            "password": "password123",
            
            "job_title": "VP of Growth",
            "company": "HyperGrowth Marketing",
            "location": "Austin, TX",
            "industry": "Marketing & Advertising",
            "bio": "Growth leader with track record of scaling B2B SaaS companies. Helped HubSpot, Intercom, and Notion reach hypergrowth. Speaker at SaaStr, GrowthHackers, and Product Marketing Summit.",
            "expertise": "Growth Marketing, Demand Generation, Product-Led Growth, Conversion Optimization",
            "looking_for": json.dumps(["Consulting projects", "Advisory board positions", "Speaking opportunities"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/michellechen",
            "twitter_url": "https://twitter.com/growth_michelle",
            "website_url": "https://hypergrowth.marketing",
            "calendly_url": "https://calendly.com/michellechen/consult",
            
            "linkedin_verified": True,
            "price_limit": 5.0,
            "wallet_balance": Decimal("892.75"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "raj.patel@cloudscale.ai",
            "username": "rajpatel",
            "first_name": "Raj",
            "last_name": "Patel",
            "description": "Engineering Leader & AI/ML Expert",
            "password": "password123",
            
            "job_title": "VP of Engineering",
            "company": "CloudScale AI",
            "location": "Seattle, WA",
            "industry": "Artificial Intelligence & Machine Learning",
            "bio": "Building ML infrastructure at scale. Former Engineering Director at Google Brain. PhD in Computer Science from Stanford. Love talking about AI, distributed systems, and engineering culture.",
            "expertise": "Machine Learning, Cloud Infrastructure, Engineering Management, Python, Go",
            "looking_for": json.dumps(["Technical partnerships", "Open source collaboration", "Mentorship opportunities"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/rajpatel",
            "twitter_url": "https://twitter.com/raj_ml",
            "website_url": "https://rajpatel.dev",
            "calendly_url": "https://calendly.com/rajpatel/tech-chat",
            
            "linkedin_verified": True,
            "price_limit": 5.0,
            "wallet_balance": Decimal("1245.00"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "emily.rodriguez@legaltech.pro",
            "username": "emilyrodriguez",
            "first_name": "Emily",
            "last_name": "Rodriguez",
            "description": "Corporate Attorney specializing in Tech Startups",
            "password": "password123",
            
            "job_title": "Partner",
            "company": "Rodriguez & Associates",
            "location": "Boston, MA",
            "industry": "Legal Services",
            "bio": "Helping startups navigate legal complexities from formation to exit. Worked on 200+ funding rounds, 30+ M&A transactions. Harvard Law grad. Advisor to multiple accelerators.",
            "expertise": "Startup Law, Venture Financing, M&A, IP Protection",
            "looking_for": json.dumps(["New client referrals", "Speaking engagements", "Startup advisory roles"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/emilyrodriguez",
            "twitter_url": "https://twitter.com/emily_legaltech",
            "website_url": "https://rodriguezlaw.com",
            "calendly_url": "https://calendly.com/emilyrodriguez/consult",
            
            "linkedin_verified": True,
            "price_limit": 5.0,
            "wallet_balance": Decimal("325.50"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "alex.thompson@designstudio.co",
            "username": "alexthompson",
            "first_name": "Alex",
            "last_name": "Thompson",
            "description": "Product Designer & UX Consultant",
            "password": "password123",
            
            "job_title": "Lead Product Designer",
            "company": "Thompson Design Studio",
            "location": "Los Angeles, CA",
            "industry": "Design & Creative Services",
            "bio": "Award-winning product designer. Created user experiences for Airbnb, Spotify, and Tesla. Passionate about designing products that delight users and drive business growth.",
            "expertise": "Product Design, UX/UI, Design Systems, User Research",
            "looking_for": json.dumps(["Design projects", "Workshop facilitation", "Design team mentorship"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/alexthompson",
            "twitter_url": "https://twitter.com/alex_designs",
            "website_url": "https://alexthompson.design",
            "calendly_url": "https://calendly.com/alexthompson/design-review",
            
            "linkedin_verified": True,
            "price_limit": 3.5,
            "wallet_balance": Decimal("156.00"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "james.wilson@sales.guru",
            "username": "jameswilson",
            "first_name": "James",
            "last_name": "Wilson",
            "description": "Enterprise Sales Leader - $50M+ in closed deals",
            "password": "password123",
            
            "job_title": "Chief Revenue Officer",
            "company": "SalesForce Pro",
            "location": "Chicago, IL",
            "industry": "Business Consulting & Sales",
            "bio": "Built and scaled sales teams at Salesforce, Oracle, and SAP. Expert in enterprise sales strategy, team building, and revenue operations. Love helping B2B companies crack enterprise sales.",
            "expertise": "Enterprise Sales, Revenue Operations, Sales Team Building, B2B Strategy",
            "looking_for": json.dumps(["Consulting opportunities", "Sales advisory roles", "Networking with founders"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/jameswilson",
            "twitter_url": "https://twitter.com/james_enterprise",
            "website_url": "https://jameswilson.com",
            "calendly_url": "https://calendly.com/jameswilson/sales-call",
            
            "linkedin_verified": True,
            "price_limit": 4.5,
            "wallet_balance": Decimal("567.25"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "lisa.nguyen@mediaco.net",
            "username": "lisanguyen",
            "first_name": "Lisa",
            "last_name": "Nguyen",
            "description": "Journalist & Content Strategist",
            "password": "password123",
            
            "job_title": "Editorial Director",
            "company": "TechMedia Network",
            "location": "Washington, DC",
            "industry": "Media & Journalism",
            "bio": "Award-winning tech journalist. Covered tech industry for WSJ, Bloomberg, and The Verge. Now helping companies tell their stories. Interested in AI, climate tech, and the future of work.",
            "expertise": "Tech Journalism, Content Strategy, PR, Storytelling",
            "looking_for": json.dumps(["Story pitches", "Interview opportunities", "Content consulting"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/lisanguyen",
            "twitter_url": "https://twitter.com/lisa_tech",
            "website_url": "https://lisanguyen.com",
            "calendly_url": "https://calendly.com/lisanguyen/interview",
            
            "linkedin_verified": True,
            "price_limit": 2.5,
            "wallet_balance": Decimal("89.50"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "tom.anderson@cto.consulting",
            "username": "tomanderson",
            "first_name": "Tom",
            "last_name": "Anderson",
            "description": "Fractional CTO for Early-Stage Startups",
            "password": "password123",
            
            "job_title": "Fractional CTO",
            "company": "Anderson Tech Advisory",
            "location": "Denver, CO",
            "industry": "Technology Consulting",
            "bio": "Helping non-technical founders build their tech teams and products. Former CTO at 3 startups (2 exits). Advisor to Y Combinator and Techstars companies.",
            "expertise": "Technical Leadership, Architecture, MVP Development, Team Building",
            "looking_for": json.dumps(["CTO consulting gigs", "Technical advisor roles", "Cofounder opportunities"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/tomanderson",
            "twitter_url": "https://twitter.com/tom_cto",
            "website_url": "https://andersoncto.com",
            "calendly_url": "https://calendly.com/tomanderson/cto-chat",
            
            "linkedin_verified": True,
            "price_limit": 4.5,
            "wallet_balance": Decimal("723.00"),
        },
        {
            "id": str(uuid.uuid4()),
            "email": "maria.garcia@hr.partners",
            "username": "mariagarcia",
            "first_name": "Maria",
            "last_name": "Garcia",
            "description": "Talent Acquisition & People Operations Expert",
            "password": "password123",
            
            "job_title": "Head of People",
            "company": "GrowthPeople Partners",
            "location": "Miami, FL",
            "industry": "Human Resources",
            "bio": "Built people teams at Stripe, Figma, and Notion. Expert in recruiting, culture, and org design. Passionate about helping startups scale their teams without losing their culture.",
            "expertise": "Recruiting, People Operations, Culture Building, Compensation Strategy",
            "looking_for": json.dumps(["Recruiting partnerships", "HR advisory roles", "Workshop facilitation"]),
            
            "linkedin_profile_url": "https://linkedin.com/in/mariagarcia",
            "twitter_url": "https://twitter.com/maria_people",
            "website_url": "https://growthpeople.com",
            "calendly_url": "https://calendly.com/mariagarcia/people-chat",
            
            "linkedin_verified": True,
            "price_limit": 4.0,
            "wallet_balance": Decimal("412.75"),
        },
    ]
    
    created_users = []
    for user_data in test_users:
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data["email"]) | (User.username == user_data["username"])
        ).first()
        
        if existing_user:
            print(f"User {user_data['username']} already exists, skipping...")
            created_users.append(existing_user)
            continue
        
        password = user_data.pop("password")
        user = User(
            **user_data,
            password_hash=get_password_hash(password),
            is_active=True,
            created_at=datetime.utcnow() - timedelta(days=30),
            last_login=datetime.utcnow() - timedelta(hours=2)
        )
        db.add(user)
        created_users.append(user)
        print(f"✓ Created user: {user.first_name} {user.last_name} (@{user.username})")
    
    db.commit()
    return created_users


def create_realistic_emails_with_payments(db: Session, users):
    """Create realistic email threads with payment tracking."""
    
    if len(users) < 3:
        print("Need at least 3 users to create emails")
        return []
    
    # Get users by username for easier reference
    user_map = {u.username: u for u in users}
    
    emails_data = [
        # Thread 1: Founder seeking investment advice
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("sarahm"),
            "subject": "Series A Fundraising Strategy Discussion",
            "body": """Hi Sarah,

I'm David Park, founder of Innovate Labs. We're building an AI-powered collaboration platform and are gearing up for our Series A round.

I've been following your investments in the collaboration space (especially your work with Notion and Figma), and I'd love to get 30 minutes of your time to discuss:

1. Current market conditions for Series A
2. Key metrics investors are looking for
3. Your thoughts on our traction and positioning

We're at $2M ARR, growing 20% MoM, with 150+ enterprise customers.

Would you be open to a brief call next week?

Best regards,
David Park
Founder & CEO, Innovate Labs""",
            "payment_amount": Decimal("5.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=5, hours=2),
            "delivered_at": datetime.utcnow() - timedelta(days=5, hours=3),
            "sent_at": datetime.utcnow() - timedelta(days=5, hours=3),
            "initial_payment_sent": True,
            "priority": "high",
        },
        {
            "sent_by": user_map.get("sarahm"),
            "received_by": user_map.get("davidpark"),
            "subject": "Re: Series A Fundraising Strategy Discussion",
            "body": """Hi David,

Great to hear from you! Your metrics look strong - 20% MoM growth is impressive.

I'd be happy to chat. I have availability Tuesday at 2 PM or Thursday at 10 AM next week. Here's my Calendly link: calendly.com/sarahm/30min

In the meantime, feel free to send over your deck and latest metrics. I'll take a look before our call.

Looking forward to connecting!

Best,
Sarah Martinez
General Partner, TechVentures Capital""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=4, hours=18),
            "delivered_at": datetime.utcnow() - timedelta(days=5),
            "sent_at": datetime.utcnow() - timedelta(days=5),
            "full_payment_sent": True,
            "thread_number": 1,
        },
        
        # Thread 2: Growth marketing consultation request
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("michellechen"),
            "subject": "Growth Strategy Consultation for B2B SaaS",
            "body": """Hi Michelle,

I came across your profile and was blown away by your track record scaling companies to $100M ARR.

We're Innovate Labs, currently at $2M ARR, and looking to accelerate our growth. Our product-market fit is solid, but we're struggling with:

- Optimizing our funnel conversion (currently 2% trial-to-paid)
- Scaling our content marketing efforts
- Building a scalable demand generation engine

Would you be interested in a consulting engagement? Looking for 4-6 hours of strategic guidance over the next month.

Happy to pay your standard consulting rate via YesReply.

Best,
David Park""",
            "payment_amount": Decimal("5.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=3, hours=10),
            "delivered_at": datetime.utcnow() - timedelta(days=3, hours=11),
            "sent_at": datetime.utcnow() - timedelta(days=3, hours=11),
            "initial_payment_sent": True,
            "full_payment_sent": True,
            "priority": "high",
        },
        {
            "sent_by": user_map.get("michellechen"),
            "received_by": user_map.get("davidpark"),
            "subject": "Re: Growth Strategy Consultation for B2B SaaS",
            "body": """Hi David,

Thanks for reaching out! I'd love to help. Your funnel conversion definitely has room for improvement - I typically see 5-7% for mature B2B SaaS products.

I'm interested in working together. My consulting rate is $500/hour, and for a strategic engagement like this, I'd recommend:

Session 1 (2 hours): Deep dive audit of your current funnel, metrics, and growth motions
Session 2 (2 hours): Strategic roadmap creation with prioritized initiatives
Session 3 (1 hour): 30-day check-in and optimization

Total: 5 hours over 4 weeks = $2,500

Does this work for you? If so, I can send over a consulting agreement and we can schedule our first session.

Best,
Michelle Chen""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=2, hours=15),
            "delivered_at": datetime.utcnow() - timedelta(days=2, hours=16),
            "sent_at": datetime.utcnow() - timedelta(days=2, hours=16),
            "thread_number": 1,
        },
        
        # Thread 3: Journalist seeking interview
        {
            "sent_by": user_map.get("lisanguyen"),
            "received_by": user_map.get("rajpatel"),
            "subject": "Interview Request: AI Infrastructure at Scale",
            "body": """Hi Raj,

I'm Lisa Nguyen, Editorial Director at TechMedia Network. I'm working on a feature story about companies building AI infrastructure at scale.

Your work at CloudScale AI is fascinating, particularly your approach to distributed ML training. I'd love to interview you for this piece.

The article will be published in our premium newsletter (150K subscribers) and on our main site. It's a great opportunity for CloudScale AI visibility.

Interview would be 30 minutes via Zoom. Can we schedule something for next week?

Best regards,
Lisa Nguyen
TechMedia Network""",
            "payment_amount": Decimal("2.50"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=6, hours=5),
            "delivered_at": datetime.utcnow() - timedelta(days=6, hours=6),
            "sent_at": datetime.utcnow() - timedelta(days=6, hours=6),
            "initial_payment_sent": True,
            "full_payment_sent": True,
        },
        {
            "sent_by": user_map.get("rajpatel"),
            "received_by": user_map.get("lisanguyen"),
            "subject": "Re: Interview Request: AI Infrastructure at Scale",
            "body": """Hi Lisa,

Thanks for reaching out! I'd be happy to participate in your story.

I'm available Tuesday afternoon or Wednesday morning next week. Let me know what works best and feel free to send over any prep questions you'd like me to think about beforehand.

Looking forward to it!

Best,
Raj Patel
VP of Engineering, CloudScale AI""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=5, hours=20),
            "delivered_at": datetime.utcnow() - timedelta(days=5, hours=21),
            "sent_at": datetime.utcnow() - timedelta(days=5, hours=21),
            "thread_number": 1,
        },
        
        # Thread 4: Partnership opportunity
        {
            "sent_by": user_map.get("jameswilson"),
            "received_by": user_map.get("davidpark"),
            "subject": "Partnership Opportunity: Enterprise Sales Channel",
            "body": """Hi David,

I'm James Wilson, CRO at SalesForce Pro. We work with 200+ enterprise clients and I think there could be a strong partnership opportunity between our companies.

Our clients are constantly asking about collaboration tools that integrate with their existing workflows. Innovate Labs could be a perfect fit.

I'd like to explore:
1. Potential reseller/referral partnership
2. White-label opportunities
3. Co-marketing initiatives

This could be a significant enterprise channel for you. Are you open to discussing?

Best,
James Wilson
Chief Revenue Officer, SalesForce Pro""",
            "payment_amount": Decimal("4.50"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=2, hours=8),
            "delivered_at": datetime.utcnow() - timedelta(days=2, hours=9),
            "sent_at": datetime.utcnow() - timedelta(days=2, hours=9),
            "initial_payment_sent": True,
            "full_payment_sent": True,
            "is_starred": True,
        },
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("jameswilson"),
            "subject": "Re: Partnership Opportunity: Enterprise Sales Channel",
            "body": """Hi James,

This sounds really interesting! We've been looking to expand into enterprise and a partnership could definitely accelerate that.

I'd love to explore all three areas you mentioned. Our product is particularly strong with enterprise customers who need security and compliance.

Let's schedule a call. I'm available this Thursday or Friday afternoon. Does either work for you?

Looking forward to discussing!

Best,
David""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=1, hours=22),
            "delivered_at": datetime.utcnow() - timedelta(days=1, hours=23),
            "sent_at": datetime.utcnow() - timedelta(days=1, hours=23),
            "thread_number": 1,
            "is_starred": True,
        },
        
        # Thread 5: Design consultation
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("alexthompson"),
            "subject": "Product Design Review Request",
            "body": """Hi Alex,

Your portfolio is incredible - the work you did on Spotify's mobile experience is exactly the kind of polish we're looking for.

We're preparing for our Series A and need to elevate our product design. Would you be available for a design review session?

Specifically looking for feedback on:
- Overall UX flow and information architecture
- Visual design and brand consistency
- Mobile responsiveness
- Onboarding experience

2-hour session, can work around your schedule. Happy to compensate via YesReply.

Best,
David Park
Innovate Labs""",
            "payment_amount": Decimal("3.50"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=4, hours=14),
            "delivered_at": datetime.utcnow() - timedelta(days=4, hours=15),
            "sent_at": datetime.utcnow() - timedelta(days=4, hours=15),
            "initial_payment_sent": True,
            "full_payment_sent": True,
        },
        {
            "sent_by": user_map.get("alexthompson"),
            "received_by": user_map.get("davidpark"),
            "subject": "Re: Product Design Review Request",
            "body": """Hi David,

Thank you! I'd be happy to help with a design review.

My standard design review process:
- Pre-review: You send me a Figma/product link and key user flows
- Live session: 2-hour deep dive where we go through everything together
- Post-review: I send a detailed PDF with recommendations and priorities

My rate is $250/hour, so $500 for the full review package.

If that works, send me access to your product and I'll prep for our session. I have availability next Tuesday or Wednesday afternoon.

Cheers,
Alex Thompson""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=3, hours=18),
            "delivered_at": datetime.utcnow() - timedelta(days=3, hours=19),
            "sent_at": datetime.utcnow() - timedelta(days=3, hours=19),
            "thread_number": 1,
        },
        
        # Thread 6: Legal consultation
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("emilyrodriguez"),
            "subject": "Series A Legal Prep - Document Review Needed",
            "body": """Hi Emily,

We're gearing up for our Series A and need an experienced startup attorney to review our current legal standing and prepare necessary documents.

Current situation:
- Incorporated in Delaware (C-Corp)
- 3 founders with vesting schedules
- 10 employees with standard option agreements
- Safe notes from pre-seed round

Need help with:
1. Cap table cleanup
2. Series A document preparation
3. Employment agreement updates
4. IP assignment review

Can you help? What's your process and pricing for this type of engagement?

Best,
David Park""",
            "payment_amount": Decimal("5.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(days=1, hours=6),
            "delivered_at": datetime.utcnow() - timedelta(days=1, hours=7),
            "sent_at": datetime.utcnow() - timedelta(days=1, hours=7),
            "initial_payment_sent": True,
            "full_payment_sent": True,
            "is_starred": True,
        },
        {
            "sent_by": user_map.get("emilyrodriguez"),
            "received_by": user_map.get("davidpark"),
            "subject": "Re: Series A Legal Prep - Document Review Needed",
            "body": """Hi David,

I'd be happy to help with your Series A legal prep. This is exactly the type of work we specialize in.

Typical Series A legal package includes:
- Cap table audit and cleanup
- Updated board consents and bylaws
- Restated certificate of incorporation
- Series A financing documents (term sheet support, SPA, IRA, etc.)
- Employee option plan updates
- Updated employment/consulting agreements

For a company your size, standard package is $15-25K depending on complexity. I'd need to do a quick audit call to give you a firm quote.

Available for a 30-minute intro call this week?

Best,
Emily Rodriguez
Partner, Rodriguez & Associates""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=18),
            "delivered_at": datetime.utcnow() - timedelta(hours=19),
            "sent_at": datetime.utcnow() - timedelta(hours=19),
            "thread_number": 1,
            "is_starred": True,
        },
        
        # Thread 7: Recruiting partnership
        {
            "sent_by": user_map.get("mariagarcia"),
            "received_by": user_map.get("davidpark"),
            "subject": "Recruiting Partnership for Engineering Roles",
            "body": """Hi David,

I help high-growth startups build their engineering teams. I saw you're at $2M ARR and likely scaling your team.

We've placed 100+ engineers at companies like Stripe, Figma, and Notion. Our specialty is finding senior ICs and engineering leaders who can scale with you.

Our model:
- No upfront fees
- 20% placement fee (industry standard is 25-30%)
- 90-day replacement guarantee
- Average time-to-hire: 28 days

We currently have 3 senior full-stack engineers and 2 engineering managers in our pipeline who might be perfect for Innovate Labs.

Interested in learning more?

Best,
Maria Garcia
Head of People, GrowthPeople Partners""",
            "payment_amount": Decimal("4.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": False,
            "delivered_at": datetime.utcnow() - timedelta(hours=8),
            "sent_at": datetime.utcnow() - timedelta(hours=8),
            "initial_payment_sent": True,
        },
        
        # Thread 8: CTO advisory
        {
            "sent_by": user_map.get("davidpark"),
            "received_by": user_map.get("tomanderson"),
            "subject": "Fractional CTO Advisory Interest",
            "body": """Hi Tom,

I'm the founder of Innovate Labs (B2B SaaS, $2M ARR). I'm technical but not an engineer by background, and we're at a point where we need more strategic technical leadership.

Our current challenges:
- Scaling our infrastructure (performance issues at peak load)
- Building out our engineering team (hiring our first eng manager)
- Technical debt starting to slow us down
- Need to architect for enterprise security/compliance

Looking for a fractional CTO to work with us 10-15 hours/month for 3-6 months.

What's your availability and how do you typically structure engagements?

Best,
David""",
            "payment_amount": Decimal("4.50"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=4),
            "delivered_at": datetime.utcnow() - timedelta(hours=5),
            "sent_at": datetime.utcnow() - timedelta(hours=5),
            "initial_payment_sent": True,
            "full_payment_sent": True,
        },
        {
            "sent_by": user_map.get("tomanderson"),
            "received_by": user_map.get("davidpark"),
            "subject": "Re: Fractional CTO Advisory Interest",
            "body": """Hi David,

This sounds like a great fit for my fractional CTO practice. The challenges you're facing are exactly what I help companies solve.

My typical engagement structure:
- 10-15 hours/month ongoing advisory
- Weekly 1:1s with you + engineering leads
- Architecture reviews and technical roadmap planning
- Hiring support (interviewing, evaluating candidates)
- On-call for urgent technical decisions

Rate: $300/hour or $4,000/month for 15 hours
Minimum 3-month engagement

I have capacity for one new client starting next month. Want to schedule a call to discuss in detail?

Best,
Tom Anderson
Fractional CTO""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=1),
            "delivered_at": datetime.utcnow() - timedelta(hours=2),
            "sent_at": datetime.utcnow() - timedelta(hours=2),
            "thread_number": 1,
        },
        
        # Thread 9: Cold outreach (no response yet - will refund)
        {
            "sent_by": user_map.get("alexthompson"),
            "received_by": user_map.get("sarahm"),
            "subject": "Portfolio Company Design Services",
            "body": """Hi Sarah,

I work with early-stage startups on product design and noticed you invest in B2B SaaS companies.

I'd love to offer design services to your portfolio companies. Many early-stage companies struggle with design and I've built a specific offering for them:

- 2-week design sprints
- Fixed-price packages starting at $10K
- Fast turnaround

Would you be open to introducing me to portfolio companies that might benefit?

Best,
Alex Thompson""",
            "payment_amount": Decimal("5.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": False,
            "delivered_at": datetime.utcnow() - timedelta(hours=50),
            "sent_at": datetime.utcnow() - timedelta(hours=50),
            "initial_payment_sent": True,
            "refund_processed": False,  # Will be refunded after 48 hours
        },
        
        # Thread 10: Speaking opportunity
        {
            "sent_by": user_map.get("lisanguyen"),
            "received_by": user_map.get("michellechen"),
            "subject": "Speaking Opportunity: Growth Summit 2024",
            "body": """Hi Michelle,

I'm organizing our annual Growth Summit (1,500+ attendees, top growth leaders from Uber, Netflix, Shopify).

We'd love to have you speak about your experience scaling B2B SaaS companies to $100M ARR.

Event Details:
- Date: March 15, 2024
- Location: San Francisco
- Session: 30-minute keynote
- Compensation: $5,000 speaker fee + travel/hotel

The session would be "Hypergrowth Playbook: Lessons from Scaling 3 Companies to $100M ARR"

Interested? I can send over more details and speaker agreement.

Best,
Lisa Nguyen""",
            "payment_amount": Decimal("2.50"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=12),
            "delivered_at": datetime.utcnow() - timedelta(hours=13),
            "sent_at": datetime.utcnow() - timedelta(hours=13),
            "initial_payment_sent": True,
            "full_payment_sent": True,
        },
        {
            "sent_by": user_map.get("michellechen"),
            "received_by": user_map.get("lisanguyen"),
            "subject": "Re: Speaking Opportunity: Growth Summit 2024",
            "body": """Hi Lisa,

This sounds great! I'd love to speak at Growth Summit.

March 15th works for my calendar. Please send over the speaker agreement and any other details (AV requirements, slide template, etc.).

For the talk, I'm thinking of structuring it as:
1. The 3 phases of hypergrowth (early, mid, late)
2. Common mistakes at each phase
3. Playbooks that worked across all 3 companies

Let me know if that resonates!

Best,
Michelle""",
            "payment_amount": Decimal("0.00"),
            "status": EmailStatus.DELIVERED,
            "is_read": True,
            "read_at": datetime.utcnow() - timedelta(hours=3),
            "delivered_at": datetime.utcnow() - timedelta(hours=4),
            "sent_at": datetime.utcnow() - timedelta(hours=4),
            "thread_number": 1,
        },
    ]
    
    created_emails = []
    for i, email_data in enumerate(emails_data):
        if email_data["sent_by"] is None or email_data["received_by"] is None:
            continue
            
        email_id = str(uuid.uuid4())
        message_id = f"<{email_id}@yesreply.tech>"
        
        sender = email_data.pop("sent_by")
        receiver = email_data.pop("received_by")
        
        email = Email(
            id=email_id,
            message_id=message_id,
            sent_by=sender.id,
            received_by=receiver.id,
            **email_data,
            created_at=email_data.get("delivered_at", datetime.utcnow())
        )
        db.add(email)
        created_emails.append(email)
        print(f"  ✓ Email {i+1}: {sender.first_name} → {receiver.first_name} | ${email.payment_amount}")
    
    db.commit()
    return created_emails


def create_transactions_and_notifications(db: Session, users, emails):
    """Create realistic transaction history and notifications."""
    
    user_map = {u.username: u for u in users}
    transactions = []
    notifications = []
    
    # Credit purchases - users buying credits
    credit_purchases = [
        {"user": user_map.get("davidpark"), "amount": Decimal("100.00"), "days_ago": 15},
        {"user": user_map.get("davidpark"), "amount": Decimal("200.00"), "days_ago": 8},
        {"user": user_map.get("alexthompson"), "amount": Decimal("50.00"), "days_ago": 10},
        {"user": user_map.get("lisanguyen"), "amount": Decimal("75.00"), "days_ago": 12},
        {"user": user_map.get("mariagarcia"), "amount": Decimal("150.00"), "days_ago": 20},
        {"user": user_map.get("jameswilson"), "amount": Decimal("100.00"), "days_ago": 18},
    ]
    
    for purchase in credit_purchases:
        if purchase["user"] is None:
            continue
        
        trans_id = str(uuid.uuid4())
        payment_id = str(uuid.uuid4())
        
        # Create payment record
        payment = Payment(
            id=payment_id,
            user_id=purchase["user"].id,
            amount=purchase["amount"],
            credits_added=purchase["amount"],
            stripe_payment_intent_id=f"pi_{uuid.uuid4().hex[:24]}",
            status="succeeded",
            card_last4="4242",
            card_brand="visa",
            created_at=datetime.utcnow() - timedelta(days=purchase["days_ago"]),
            succeeded_at=datetime.utcnow() - timedelta(days=purchase["days_ago"])
        )
        db.add(payment)
        
        # Create transaction record
        transaction = Transaction(
            id=trans_id,
            user_id=purchase["user"].id,
            type=TransactionType.CREDIT_PURCHASE,
            status=TransactionStatus.COMPLETED,
            amount=purchase["amount"],
            payment_id=payment_id,
            description=f"Credit purchase - ${purchase['amount']}",
            created_at=datetime.utcnow() - timedelta(days=purchase["days_ago"])
        )
        db.add(transaction)
        transactions.append(transaction)
        print(f"  ✓ Credit purchase: {purchase['user'].first_name} bought ${purchase['amount']}")
    
    # Email payment transactions
    for email in emails:
        sender = db.query(User).filter(User.id == email.sent_by).first()
        receiver = db.query(User).filter(User.id == email.received_by).first()
        
        if not sender or not receiver or email.payment_amount == 0:
            continue
        
        # Deduction from sender
        deduction_id = str(uuid.uuid4())
        deduction = Transaction(
            id=deduction_id,
            user_id=sender.id,
            type=TransactionType.EMAIL_SENT_DEDUCTION,
            status=TransactionStatus.COMPLETED,
            amount=-email.payment_amount,
            email_id=email.id,
            description=f"Email sent to {receiver.first_name} {receiver.last_name}",
            created_at=email.sent_at or email.created_at
        )
        db.add(deduction)
        transactions.append(deduction)
        
        # Initial payment to receiver (5 cents on receive)
        if email.initial_payment_sent:
            initial_id = str(uuid.uuid4())
            initial_payment = Transaction(
                id=initial_id,
                user_id=receiver.id,
                type=TransactionType.EMAIL_RECEIVED,
                status=TransactionStatus.COMPLETED,
                amount=Decimal("0.05"),
                email_id=email.id,
                description=f"Email received from {sender.first_name} {sender.last_name}",
                created_at=email.delivered_at or email.created_at
            )
            db.add(initial_payment)
            transactions.append(initial_payment)
            
            # Notification for initial payment
            notif_id = str(uuid.uuid4())
            notification = Notification(
                id=notif_id,
                user_id=receiver.id,
                type=NotificationType.PAYMENT_RECEIVED,
                title="Payment Received!",
                message=f"{sender.first_name} {sender.last_name} paid ${email.payment_amount} to reach you. You earned $0.05 for receiving the email.",
                amount=Decimal("0.05"),
                potential_amount=email.payment_amount - Decimal("0.05"),
                email_id=email.id,
                transaction_id=initial_id,
                is_read=email.is_read,
                created_at=email.delivered_at or email.created_at
            )
            db.add(notification)
            notifications.append(notification)
            print(f"  ✓ Email payment: {sender.first_name} → {receiver.first_name} | -${email.payment_amount} / +$0.05")
        
        # Full payment on response
        if email.full_payment_sent and email.thread_number == 1:
            remaining = email.payment_amount - Decimal("0.05")
            full_payment_id = str(uuid.uuid4())
            full_payment = Transaction(
                id=full_payment_id,
                user_id=receiver.id,
                type=TransactionType.EMAIL_RESPONDED,
                status=TransactionStatus.COMPLETED,
                amount=remaining,
                email_id=email.id,
                description=f"Email response bonus from {sender.first_name} {sender.last_name}",
                created_at=email.sent_at or email.created_at
            )
            db.add(full_payment)
            transactions.append(full_payment)
            
            # Notification for response payment
            notif_id = str(uuid.uuid4())
            notification = Notification(
                id=notif_id,
                user_id=receiver.id,
                type=NotificationType.PAYMENT_RESPONSE_AVAILABLE,
                title="Response Bonus Earned!",
                message=f"You earned ${remaining} for responding to {sender.first_name} {sender.last_name}'s email!",
                amount=remaining,
                email_id=email.id,
                transaction_id=full_payment_id,
                is_read=True,
                created_at=email.sent_at or email.created_at
            )
            db.add(notification)
            notifications.append(notification)
            print(f"  ✓ Response bonus: {receiver.first_name} earned ${remaining}")
    
    # Cashouts - users withdrawing money
    cashouts_data = [
        {"user": user_map.get("rajpatel"), "amount": Decimal("500.00"), "days_ago": 5, "status": CashoutStatus.COMPLETED},
        {"user": user_map.get("michellechen"), "amount": Decimal("300.00"), "days_ago": 3, "status": CashoutStatus.PENDING},
        {"user": user_map.get("sarahm"), "amount": Decimal("150.00"), "days_ago": 1, "status": CashoutStatus.PROCESSING},
    ]
    
    for cashout_data in cashouts_data:
        if cashout_data["user"] is None:
            continue
        
        cashout_id = str(uuid.uuid4())
        trans_id = str(uuid.uuid4())
        
        # Create cashout record
        cashout = Cashout(
            id=cashout_id,
            user_id=cashout_data["user"].id,
            amount=cashout_data["amount"],
            status=cashout_data["status"],
            bank_account_holder_name=f"{cashout_data['user'].first_name} {cashout_data['user'].last_name}",
            bank_account_last4="6789",
            stripe_bank_account_id=f"ba_{uuid.uuid4().hex[:24]}",
            created_at=datetime.utcnow() - timedelta(days=cashout_data["days_ago"]),
            completed_at=datetime.utcnow() - timedelta(days=cashout_data["days_ago"] - 1) if cashout_data["status"] == CashoutStatus.COMPLETED else None
        )
        db.add(cashout)
        
        # Create transaction record
        transaction = Transaction(
            id=trans_id,
            user_id=cashout_data["user"].id,
            type=TransactionType.CASHOUT,
            status=TransactionStatus.COMPLETED if cashout_data["status"] == CashoutStatus.COMPLETED else TransactionStatus.PENDING,
            amount=-cashout_data["amount"],
            cashout_id=cashout_id,
            description=f"Cashout to bank account ending in 6789",
            created_at=datetime.utcnow() - timedelta(days=cashout_data["days_ago"])
        )
        db.add(transaction)
        transactions.append(transaction)
        print(f"  ✓ Cashout: {cashout_data['user'].first_name} withdrew ${cashout_data['amount']} ({cashout_data['status'].value})")
    
    db.commit()
    return transactions, notifications


def main():
    """Main function to populate sophisticated dummy data."""
    print("\n" + "=" * 80)
    print("🎯 YESREPLY - SOPHISTICATED DUMMY DATA GENERATOR")
    print("=" * 80)
    print()
    
    db = SessionLocal()
    
    try:
        print("📋 STEP 1: Creating sophisticated user profiles...")
        print("-" * 80)
        users = create_sophisticated_users(db)
        print(f"\n✅ Created {len(users)} professional users")
        print()
        
        print("📧 STEP 2: Creating realistic email threads with payments...")
        print("-" * 80)
        emails = create_realistic_emails_with_payments(db, users)
        print(f"\n✅ Created {len(emails)} emails")
        print()
        
        print("💰 STEP 3: Creating transactions and notifications...")
        print("-" * 80)
        transactions, notifications = create_transactions_and_notifications(db, users, emails)
        print(f"\n✅ Created {len(transactions)} transactions and {len(notifications)} notifications")
        print()
        
        print("=" * 80)
        print("✅ DUMMY DATA POPULATION COMPLETED SUCCESSFULLY!")
        print("=" * 80)
        print()
        print("👥 TEST USER CREDENTIALS (password for all: password123)")
        print("-" * 80)
        print()
        
        user_map = {u.username: u for u in users}
        
        credentials = [
            ("sarahm", "Sarah Martinez", "VC - TechVentures", f"${user_map.get('sarahm').wallet_balance}", "$5.00"),
            ("davidpark", "David Park", "CEO - Innovate Labs", f"${user_map.get('davidpark').wallet_balance}", "$4.00"),
            ("michellechen", "Michelle Chen", "VP Growth", f"${user_map.get('michellechen').wallet_balance}", "$5.00"),
            ("rajpatel", "Raj Patel", "VP Eng - CloudScale", f"${user_map.get('rajpatel').wallet_balance}", "$5.00"),
            ("emilyrodriguez", "Emily Rodriguez", "Partner - Law", f"${user_map.get('emilyrodriguez').wallet_balance}", "$5.00"),
        ]
        
        for username, name, title, balance, price_limit in credentials:
            user = user_map.get(username)
            if user:
                print(f"🔹 {name} (@{username})")
                print(f"   Email: {user.email}")
                print(f"   Role: {title}")
                print(f"   Price Limit: {price_limit}")
                print(f"   Wallet Balance: {balance}")
        print()
        
        print("=" * 80)
        print("💡 WHAT'S IN THE DATABASE:")
        print("-" * 80)
        print("• 10 professional users with complete profiles")
        print("• 20+ emails with realistic conversations")
        print("• Payment tracking for each email")
        print("• Credit purchases, email payments, and cashouts")
        print("• Notifications for payment events")
        print("• Realistic wallet balances and transaction history")
        print()
        print("=" * 80)
        print("🚀 Ready to test in the UI!")
        print("=" * 80)
        print()
        
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}")
        import traceback
        traceback.print_exc()
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
