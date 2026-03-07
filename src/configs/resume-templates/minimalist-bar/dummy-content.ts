/**
 * Minimalist Bar - Dummy Resume Content
 */

export const minimalistBarDummyContent = {
    personalInfo: {
        fullName: "Anil Kumar",
        jobTitle: "Salesforce Engineer",
        location: "New Delhi, India",
        phone: "+91 98523 21272",
        email: "kumar@grosemio.in",
        linkedin: "linkedin.com/in/anilkumar",
        github: "github.com/anilkumar",
    },

    profileSummary:
        "Salesforce Engineer with 5+ years of experience designing, developing, and implementing Salesforce solutions. Skilled in Sales Cloud, Apex, Lightning Experience, and system integrations, with a strong focus on performance optimization and user experience.",

    experience: [
        {
            position: "Salesforce Engineer",
            company: "Tech Solutions Pvt. Ltd.",
            location: "India",
            startDate: "2018-06",
            endDate: "Present",
            current: true,
            description: [
                "Designed and implemented Salesforce CRM solutions to support business operations.",
                "Migrated data and customized legacy systems into Salesforce.",
                "Collaborated with cross-functional teams to integrate Salesforce with enterprise systems.",
            ],
        },
        {
            position: "Junior Salesforce Developer",
            company: "Innovatech",
            location: "India",
            startDate: "2016-10",
            endDate: "2018-05",
            current: false,
            description: [
                "Configured Salesforce applications and developed custom Apex classes and triggers.",
                "Supported end users by troubleshooting and resolving platform issues.",
            ],
        },
    ],

    education: [
        {
            degree: "Bachelor of Engineering",
            institution: "Vellore Institute of Technology (VIT)",
            location: "Vellore, India",
            startDate: "2012",
            endDate: "2016",
        },
    ],

    skills: [
        "Salesforce CRM",
        "Apex",
        "Lightning Experience",
        "Visualforce",
        "Data Migration",
    ],

    projects: [
        {
            name: "Salesforce Migration for XYZ Corp",
            description:
                "Led migration from legacy CRM to Salesforce Lightning, improving data accuracy and user adoption.",
        },
        {
            name: "Custom Sales Dashboard for ABC Ltd",
            description:
                "Developed analytics dashboard to track KPIs and revenue forecasts, improving reporting efficiency.",
        },
    ],

    certificates: [
        "Salesforce Certified Administrator",
        "Salesforce Certified Advanced Administrator",
    ],
};

export default minimalistBarDummyContent;
