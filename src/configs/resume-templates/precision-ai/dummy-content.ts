/**
 * Precision AI - Dummy Resume Content
 */

export const precisionAiDummyContent = {
  personalInfo: {
    fullName: "Meghana Hegde",
    jobTitle: "Data Scientist & AI Specialist",
    email: "meghana.hegde@email.com",
    phone: "+1 312-555-0199",
    location: "Urbana, Illinois",
    linkedin: "linkedin.com/in/meghanahegde",
    github: "github.com/meghanahegde",
  },

  profileSummary:
    "Data Scientist and AI Specialist with 3+ years of experience developing production-grade ML and GenAI systems across cloud platforms. Strong background in model optimization, scalable data pipelines, and real-time analytics.",

  experience: [
    {
      position: "Machine Learning Engineer Intern",
      company: "Nexus AI",
      location: "Seattle, United States",
      startDate: "2025-06",
      endDate: "Present",
      current: true,
      description: [
        "Built and deployed LLM-driven testing agents using REST APIs and k6, increasing API coverage by 2.5x.",
        "Deployed containerized services on AWS ECS Fargate with CI/CD automation.",
      ],
    },
  ],

  education: [
    {
      degree: "MS in Data Science",
      institution: "University of Illinois Urbana-Champaign",
      location: "Urbana, United States",
      startDate: "2023",
      endDate: "2025",
    },
  ],

  skills: [
    "Python, SQL, Spark, Kafka",
    "Machine Learning, NLP, Transformers, XGBoost",
    "LLMs, RAG, Vector Databases",
    "AWS, GCP, Azure, Docker, Kubernetes",
  ],

  projects: [
    {
      name: "Mistral-7B Clinical Chatbot",
      description:
        "Fine-tuned Mistral-7B using QLoRA and deployed via Hugging Face Spaces with reproducible pipelines.",
    },
  ],

  certificates: [
    "Azure AI Engineer Associate",
    "Snowflake SnowPro Core",
    "Confluent Certified Developer for Apache Kafka",
  ],
};

export default precisionAiDummyContent;
