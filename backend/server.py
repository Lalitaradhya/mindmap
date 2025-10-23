import json
from typing import Dict, List, Any, TypedDict, Annotated
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain_core.messages import HumanMessage
from langgraph.graph import StateGraph, END
from operator import add
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os
from datetime import datetime
from google.auth.transport import requests
from google.oauth2 import id_token
import requests as http_requests

# Load environment variables
load_dotenv()

# Initialize FastAPI app
app = FastAPI(title="UPSC Mind Map Generator API")

# Define allowed emails
ALLOWED_EMAILS = ['lalitaradhya@gmail.com', 'ipsraju@gmail.com']

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://visualias.online"],  # Vite dev server, React app URLs, and production domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/news")
async def get_news(page: int = 1, size: int = 10):
    try:
        saved_news_file = "saved_news.json"
        next_page_file = "next_page.txt"
        
        api_key = os.getenv('NEWS_API_KEY')
        if not api_key:
            raise HTTPException(status_code=500, detail="News API key not configured")
        
        if page == 1:
            url = f"https://newsdata.io/api/1/latest?apikey={api_key}&country=in&language=en&size={size}&excludecategory=entertainment,crime,sports"
        else:
            if not os.path.exists(next_page_file):
                raise HTTPException(status_code=400, detail="No next page available")
            with open(next_page_file, "r") as f:
                next_page_token = f.read().strip()
            print(f"Next page token: {next_page_token}")  # Debug log
            url = f"https://newsdata.io/api/1/latest?apikey={api_key}&country=in&language=en&size={size}&page={next_page_token}&excludecategory=entertainment,crime,sports"
        
        response = http_requests.get(url)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail="Failed to fetch news")
        
        data = response.json()
        print(f"API Response for page {page}: {data}")  # Debug log
        if data.get('status') == 'success':
            articles = data.get('results', [])
            next_page = data.get('nextPage')
            print(f"Next page from API: {next_page}")  # Debug log
            
            if page == 1:
                saved_data = {"articles": articles}
                with open(saved_news_file, "w") as f:
                    json.dump(saved_data, f)
                if next_page:
                    with open(next_page_file, "w") as f:
                        f.write(next_page)
            else:
                if next_page:
                    with open(next_page_file, "w") as f:
                        f.write(next_page)
            
            return {"articles": articles}
        else:
            raise HTTPException(status_code=500, detail=f"API error: {data.get('message', 'Unknown error')}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching news: {str(e)}")

@app.post("/save-article")
async def save_article(article: dict):
    try:
        saved_file = 'saved_articles.json'
        if os.path.exists(saved_file):
            with open(saved_file, 'r') as f:
                saved = json.load(f)
        else:
            saved = []
        if not any(a['article_id'] == article['article_id'] for a in saved):
            saved.append(article)
            with open(saved_file, 'w') as f:
                json.dump(saved, f, indent=4)
        return {"message": "Article saved"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving article: {str(e)}")

@app.get("/saved-articles")
async def get_saved_articles():
    try:
        saved_file = 'saved_articles.json'
        if os.path.exists(saved_file):
            with open(saved_file, 'r') as f:
                saved = json.load(f)
        else:
            saved = []
        return {"articles": saved}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching saved articles: {str(e)}")

@app.delete("/saved-articles/{article_id}")
async def delete_saved_article(article_id: str):
    try:
        saved_file = 'saved_articles.json'
        if os.path.exists(saved_file):
            with open(saved_file, 'r') as f:
                saved = json.load(f)
        else:
            saved = []
        
        # Find and remove the article
        original_length = len(saved)
        saved = [a for a in saved if a.get('article_id') != article_id]
        
        if len(saved) < original_length:
            with open(saved_file, 'w') as f:
                json.dump(saved, f, indent=4)
            return {"message": "Article deleted"}
        else:
            raise HTTPException(status_code=404, detail="Article not found")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting article: {str(e)}")

@app.get("/auth/client-id")
async def get_client_id():
    client_id = os.getenv('GOOGLE_CLIENT_ID')
    if not client_id:
        raise HTTPException(status_code=500, detail="Google Client ID not configured")
    return {"client_id": client_id}

class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/auth/google")
async def google_auth(request: GoogleAuthRequest):
    try:
        # Verify the token
        idinfo = id_token.verify_oauth2_token(request.token, requests.Request(), os.getenv('GOOGLE_CLIENT_ID'))
        
        # Extract email and check if allowed
        email = idinfo.get('email')
        if email not in ALLOWED_EMAILS:
            raise HTTPException(status_code=403, detail="Access denied: Your email is not authorized.")
        
        # If verification succeeds, idinfo contains user info
        return {"user": {"email": idinfo['email'], "name": idinfo['name'], "picture": idinfo.get('picture')}}
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid token")

# Load MCQ data
MCQ_DATA_FILE = "../src/gs-1-prelims/gs-1-prelims-25/data.json"
mcq_data = []
try:
    with open(MCQ_DATA_FILE, 'r') as f:
        mcq_data = json.load(f)
except FileNotFoundError:
    print(f"Warning: {MCQ_DATA_FILE} not found. MCQ generation may not work properly.")
except json.JSONDecodeError:
    print(f"Warning: Error parsing {MCQ_DATA_FILE}. MCQ generation may not work properly.")

# Initialize LLM
llm = ChatOpenAI(model="gpt-5-nano", temperature=1)

# State management
class UPSCMindMapState(TypedDict):
    topic: str
    definition: str
    syllabus_mapping: Dict[str, str]
    key_concepts: List[str]
    primary_branches: List[Dict[str, Any]]
    previous_year_questions: List[str]
    current_affairs_links: List[str]
    quality_score: float
    feedback: List[str]
    iteration_count: int
    messages: Annotated[List, add]

# Request/Response models
class UPSCMindMapRequest(BaseModel):
    topic: str
    paper_type: str = "GS"  # GS (General Studies), Optional, Essay
    preparation_stage: str = "prelims"  # prelims, mains, interview
    focus_areas: List[str] = []

class UPSCMindMapResponse(BaseModel):
    topic: str
    definition: str
    syllabusMapping: Dict[str, str]
    keyConcepts: List[str]
    primaryBranches: List[Dict[str, Any]]
    previousYearQuestions: List[str]
    currentAffairsLinks: List[str]

# Saved Generation models
class SavedGenerationRequest(BaseModel):
    user_id: str = "anonymous"  # For future user authentication
    topic: str
    preparation_stage: str
    focus_areas: List[str]
    mindmap_data: Dict[str, Any]
    generation_time: float

class SavedGenerationResponse(BaseModel):
    id: str
    user_id: str
    topic: str
    preparation_stage: str
    focus_areas: List[str]
    mindmap_data: Dict[str, Any]
    generation_time: float
    created_at: str

# MCQ Generation models
class MCQGenerationRequest(BaseModel):
    topic: str

class MCQItem(BaseModel):
    question: str
    options: List[str]
    answer: str
    explanation: str

class MCQGenerationResponse(BaseModel):
    topic: str
    mcqs: List[MCQItem]

# In-memory storage for saved generations (replace with database in production)
saved_generations = []

# File path for persistent storage
SAVED_GENERATIONS_FILE = "saved_generations.json"

def load_saved_generations():
    """Load saved generations from JSON file"""
    global saved_generations
    if os.path.exists(SAVED_GENERATIONS_FILE):
        try:
            with open(SAVED_GENERATIONS_FILE, 'r') as f:
                saved_generations = json.load(f)
        except (json.JSONDecodeError, FileNotFoundError):
            saved_generations = []
    else:
        saved_generations = []

def save_saved_generations():
    """Save saved generations to JSON file"""
    try:
        with open(SAVED_GENERATIONS_FILE, 'w') as f:
            json.dump(saved_generations, f, indent=2)
    except Exception as e:
        print(f"Error saving generations: {e}")

# Load saved generations on startup
load_saved_generations()

# UPSC-specific knowledge retrieval tools
def get_upsc_topic_definition(topic: str) -> str:
    """Get UPSC-focused definition of a topic."""
    prompt = f"""
    Provide a clear, UPSC-oriented definition of '{topic}' suitable for Civil Services examination.
    Focus on:
    1. Constitutional/legal/administrative aspects if applicable
    2. Relevance in Indian context
    3. Key dimensions asked in UPSC exams
    4. Government schemes/initiatives related to this topic

    Keep it comprehensive yet concise (3-4 sentences) with exam perspective.
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content

def map_to_upsc_syllabus(topic: str) -> Dict[str, str]:
    """Map topic to UPSC syllabus sections."""
    prompt = f"""
    Map the topic '{topic}' to relevant UPSC syllabus sections.
    
    Return a JSON object with:
    - "prelims": relevant prelims syllabus sections (as a string)
    - "mains": relevant mains paper numbers and topics (GS-1, GS-2, GS-3, GS-4) (as a string)
    - "optional": if applicable to any optional subjects (as a string)
    
    Be specific about which part of syllabus it covers. Ensure all values are strings.
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        result = json.loads(response.content)
        # Ensure all values are strings
        return {key: str(value) for key, value in result.items()}
    except:
        return {
            "prelims": "General awareness",
            "mains": "Relevant to GS papers",
            "optional": "Check specific optional syllabus"
        }

def get_key_upsc_concepts(topic: str) -> List[str]:
    """Get key concepts and dimensions for UPSC preparation."""
    prompt = f"""
    For the UPSC topic '{topic}', provide 6-8 key concepts/dimensions that are frequently asked.
    Include:
    - Constitutional provisions
    - Government schemes
    - International conventions
    - Important committees/commissions
    - Recent developments
    - Critical analysis points
    
    Return only the concepts, separated by commas.
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    concepts = [concept.strip() for concept in response.content.split(',')]
    return concepts[:8]  # Limit to 8 concepts

def generate_upsc_mind_map_branches(topic: str, definition: str, stage: str) -> List[Dict[str, Any]]:
    """Generate UPSC-specific mind map branches."""
    stage_guide = {
        "prelims": "Focus on facts, dates, schemes, constitutional articles, and static portions",
        "mains": "Include analytical dimensions, case studies, examples, pros-cons, way forward",
        "interview": "Add ethical dimensions, personal opinions, current debates, practical applications"
    }

    prompt = f"""
    Create primary branches for a UPSC mind map about '{topic}'.

    Definition: {definition}
    Preparation Stage: {stage} - {stage_guide.get(stage, stage_guide['prelims'])}

    Return a JSON array where each branch represents a key dimension with:
    - id: simple lowercase identifier
    - title: dimension name (e.g., "Constitutional Aspects", "Government Initiatives")
    - icon: relevant emoji
    - color: hex color code
    - items: array of specific points/facts/examples relevant to UPSC
    - importance: "high", "medium", or "low" for exam priority

    Include these essential UPSC dimensions where applicable:
    1. Constitutional/Legal Framework
    2. Government Schemes & Policies  
    3. Historical Evolution
    4. Current Affairs & Recent Developments
    5. International Perspective & Comparisons
    6. Challenges & Issues
    7. Way Forward & Solutions
    8. Committee Recommendations
    """

    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        return json.loads(response.content)
    except json.JSONDecodeError:
        # Fallback UPSC structure
        return [
            {
                "id": "constitutional",
                "title": "Constitutional Framework",
                "icon": "📜",
                "color": "#FF6B6B",
                "items": ["Articles", "Amendments", "Provisions"],
                "importance": "high"
            },
            {
                "id": "schemes",
                "title": "Government Schemes",
                "icon": "🏛️",
                "color": "#4ECDC4",
                "items": ["Central schemes", "State initiatives", "Implementation"],
                "importance": "high"
            }
        ]

def get_previous_year_questions(topic: str) -> List[str]:
    """Generate sample PYQs related to the topic."""
    prompt = f"""
    Generate 1-2 sample UPSC previous year question patterns related to '{topic}'.
    Include mix of:
    - Prelims MCQ style
    - Mains analytical questions
    
    Format each as a brief question that could appear in UPSC.
    Return as a simple list separated by newlines.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip().split('\n')[:4]

def get_current_affairs_connections(topic: str) -> List[str]:
    """Get current affairs connections for the topic."""
    prompt = f"""
    List 1-2 recent current affairs connections (2020-2025) related to '{topic}' relevant for UPSC.
    Include:
    - Recent government initiatives
    - Supreme Court judgments
    - International developments
    - Committee reports
    
    Return as brief points separated by newlines.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    return response.content.strip().split('\n')[:4]

def generate_mcqs_for_topic(topic: str) -> List[Dict[str, Any]]:
    """Generate MCQs for a given topic using reference data."""
    if not mcq_data:
        # Fallback if data.json is not available
        prompt = f"""
        Generate 5 UPSC-style MCQs for the topic '{topic}'.

        Ensure a minimum of 2 questions have a unique format (e.g., factual, analytical, current affairs-based, or case-study style).

        Return a JSON array where each MCQ has:
        - question: the question text
        - options: array of 4 options (a, b, c, d format)
        - answer: the correct option
        - explanation: brief explanation
        
        Make them similar to UPSC prelims questions.
        """
        
        response = llm.invoke([HumanMessage(content=prompt)])
        try:
            return json.loads(response.content)
        except:
            return []
    
    # Use reference data to generate similar questions
    # Sample a few questions from data.json for reference
    reference_questions = mcq_data[:50]  # Use first 50 as examples

    prompt = f"""
    Generate 5 UPSC-style MCQs for the topic '{topic}'.

    Ensure a minimum of 2 questions have a unique format (e.g., factual, analytical, current affairs-based, or case-study style).

    Use these reference questions as style guide:
    {json.dumps(reference_questions, indent=2)}
    
    Return a JSON array where each MCQ has:
    - question: the question text (similar style to references)
    - options: array of 4 options (a, b, c, d format like references)
    - answer: the correct option (e.g., "(a) Option text")
    - explanation: brief explanation of why the answer is correct
    
    Make them relevant to '{topic}' and follow UPSC prelims format.
    """
    
    response = llm.invoke([HumanMessage(content=prompt)])
    try:
        mcqs = json.loads(response.content)
        return mcqs
    except json.JSONDecodeError:
        # Fallback: return empty list or basic structure
        return []

# Prompt Chaining - Sequential processing nodes
def upsc_research_node(state: UPSCMindMapState) -> Dict[str, Any]:
    """Research phase - gather UPSC-specific information"""
    topic = state["topic"]
    
    # Chain 1: Get UPSC-oriented definition
    definition = get_upsc_topic_definition(topic)
    
    # Chain 2: Map to syllabus
    syllabus_mapping = map_to_upsc_syllabus(topic)
    
    # Chain 3: Get key concepts for UPSC
    key_concepts = get_key_upsc_concepts(topic)
    
    # Chain 4: Get PYQs
    pyqs = get_previous_year_questions(topic)
    
    # Chain 5: Get current affairs
    current_affairs = get_current_affairs_connections(topic)
    
    return {
        "definition": definition,
        "syllabus_mapping": syllabus_mapping,
        "key_concepts": key_concepts,
        "previous_year_questions": pyqs,
        "current_affairs_links": current_affairs,
        "messages": [f"Researched UPSC material for '{topic}'"]
    }

def upsc_generate_node(state: UPSCMindMapState) -> Dict[str, Any]:
    """Generation phase - create UPSC mind map structure"""
    topic = state["topic"]
    definition = state["definition"]
    
    # Default to mains preparation (most comprehensive)
    stage = "mains"
    
    primary_branches = generate_upsc_mind_map_branches(topic, definition, stage)
    
    return {
        "primary_branches": primary_branches,
        "messages": [f"Generated {len(primary_branches)} UPSC-focused branches"]
    }

# Chapter 4: Reflection - Quality assessment for UPSC content
def upsc_reflect_node(state: UPSCMindMapState) -> Dict[str, Any]:
    """Reflect on UPSC relevance and completeness"""
    
    reflection_prompt = f"""
    Evaluate this UPSC mind map for '{state['topic']}':
    
    Definition: {state['definition']}
    Syllabus Coverage: {state['syllabus_mapping']}
    Key Concepts: {len(state['key_concepts'])}
    Branches: {len(state['primary_branches'])}
    PYQs: {len(state.get('previous_year_questions', []))}
    
    Rate the quality (1-10) based on:
    1. UPSC syllabus coverage
    2. Inclusion of government schemes/initiatives
    3. Constitutional/legal aspects coverage
    4. Current affairs integration
    5. Answer-writing value
    6. Prelims + Mains relevance
    
    Provide score and brief feedback.
    Format: SCORE: X | FEEDBACK: your thoughts
    """
    
    response = llm.invoke([HumanMessage(content=reflection_prompt)])
    
    try:
        parts = response.content.split('|')
        score_part = parts[0].split(':')[1].strip()
        feedback_part = parts[1].split(':')[1].strip()
        
        score = float(score_part)
        feedback = [feedback_part]
    except:
        score = 7.0
        feedback = ["Generated UPSC-focused mind map"]
    
    return {
        "quality_score": score,
        "feedback": feedback,
        "iteration_count": state.get("iteration_count", 0) + 1,
        "messages": [f"UPSC relevance score: {score}/10"]
    }

# Chapter 2: Routing - Decision logic
def should_improve_upsc(state: UPSCMindMapState) -> str:
    """Route based on UPSC quality score"""
    quality_score = state.get("quality_score", 0)
    iteration_count = state.get("iteration_count", 0)
    
    if quality_score < 7.0 and iteration_count < 2:  # Higher threshold for UPSC
        return "improve"
    else:
        return "finalize"

def upsc_improve_node(state: UPSCMindMapState) -> Dict[str, Any]:
    """Improvement node for enhancing UPSC relevance"""
    
    improvement_prompt = f"""
    The current UPSC mind map for '{state['topic']}' scored {state['quality_score']}/10.
    Issues: {state['feedback']}
    
    Generate improved branches with:
    - More specific UPSC syllabus connections
    - Additional government schemes and initiatives
    - Better constitutional/legal provisions
    - More current affairs integration
    - Clearer prelims vs mains differentiation
    
    Return improved JSON structure focusing on UPSC exam requirements.
    """
    
    response = llm.invoke([HumanMessage(content=improvement_prompt)])
    
    try:
        improved_branches = json.loads(response.content)
        return {
            "primary_branches": improved_branches,
            "messages": [f"Enhanced UPSC relevance (iteration {state['iteration_count']})"]
        }
    except:
        return {"messages": ["UPSC enhancement completed"]}

def upsc_finalize_node(state: UPSCMindMapState) -> Dict[str, Any]:
    """Final processing with UPSC tips"""
    return {
        "messages": [f"UPSC mind map for '{state['topic']}' ready with score: {state['quality_score']}/10"]
    }

# Build the UPSC workflow graph
def create_upsc_mindmap_workflow():
    """Orchestrate the UPSC-specific workflow"""
    workflow = StateGraph(UPSCMindMapState)
    
    # Add nodes
    workflow.add_node("research", upsc_research_node)
    workflow.add_node("generate", upsc_generate_node) 
    workflow.add_node("reflect", upsc_reflect_node)
    workflow.add_node("improve", upsc_improve_node)
    workflow.add_node("finalize", upsc_finalize_node)
    
    # Define the flow
    workflow.set_entry_point("research")
    workflow.add_edge("research", "generate")
    workflow.add_edge("generate", "reflect")
    
    # Conditional routing
    workflow.add_conditional_edges(
        "reflect",
        should_improve_upsc,
        {
            "improve": "improve",
            "finalize": "finalize"
        }
    )
    
    workflow.add_edge("improve", "reflect")
    workflow.add_edge("finalize", END)
    
    return workflow.compile()

# Initialize the workflow
upsc_mindmap_workflow = create_upsc_mindmap_workflow()

@app.post("/api/upsc-mindmap", response_model=UPSCMindMapResponse)
async def generate_upsc_mindmap(request: UPSCMindMapRequest):
    """Main API endpoint for UPSC mind maps"""
    try:
        # Initial state
        initial_state = {
            "topic": request.topic,
            "definition": "",
            "syllabus_mapping": {},
            "key_concepts": [],
            "primary_branches": [],
            "previous_year_questions": [],
            "current_affairs_links": [],
            "quality_score": 0.0,
            "feedback": [],
            "iteration_count": 0,
            "messages": []
        }
        
        # Run the workflow
        result = await upsc_mindmap_workflow.ainvoke(initial_state)
        
        return UPSCMindMapResponse(
            topic=result["topic"],
            definition=result["definition"],
            syllabusMapping=result["syllabus_mapping"],
            keyConcepts=result["key_concepts"],
            primaryBranches=result["primary_branches"],
            previousYearQuestions=result["previous_year_questions"],
            currentAffairsLinks=result["current_affairs_links"]
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating UPSC mind map: {str(e)}")

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "UPSC Mind Map API is running"}

# UPSC-specific suggested topics
UPSC_SUGGESTED_TOPICS = [
    {
        "category": "Polity & Governance",
        "topics": [
            "Fundamental Rights",
            "Directive Principles of State Policy",
            "Panchayati Raj System",
            "Electoral Reforms",
            "Judicial Review",
            "Parliamentary Privileges",
            "Anti-Defection Law",
            "Cooperative Federalism"
        ]
    },
    {
        "category": "Economy", 
        "topics": [
            "Fiscal Policy",
            "Monetary Policy",
            "GST Implementation",
            "Banking Sector Reforms",
            "Agricultural Marketing",
            "Digital Economy",
            "Foreign Direct Investment",
            "Public Distribution System"
        ]
    },
    {
        "category": "Environment & Geography",
        "topics": [
            "Climate Change Mitigation",
            "Biodiversity Conservation",
            "Monsoon System",
            "River Linking Project",
            "Disaster Management",
            "Environmental Impact Assessment",
            "Sustainable Development Goals",
            "Urban Planning"
        ]
    },
    {
        "category": "International Relations",
        "topics": [
            "India's Neighborhood First Policy",
            "Act East Policy",
            "QUAD Grouping",
            "BRICS",
            "India-China Border Issues",
            "United Nations Reforms",
            "Regional Trade Agreements",
            "Nuclear Doctrine"
        ]
    },
    {
        "category": "Social Issues",
        "topics": [
            "Women Empowerment",
            "Education Policy (NEP 2020)",
            "Healthcare System",
            "Poverty Alleviation",
            "Social Justice",
            "Digital Divide",
            "Demographic Dividend",
            "Caste System"
        ]
    },
    {
        "category": "Science & Technology",
        "topics": [
            "Space Technology",
            "Artificial Intelligence Applications",
            "Biotechnology in Agriculture",
            "Renewable Energy",
            "Cyber Security",
            "5G Technology",
            "Vaccine Development",
            "Digital India Initiative"
        ]
    },
    {
        "category": "Ethics & Integrity",
        "topics": [
            "Ethics in Governance",
            "Civil Service Values",
            "Emotional Intelligence",
            "Corporate Governance",
            "Public Service Delivery",
            "Probity in Governance",
            "Ethical Dilemmas",
            "Attitude and Aptitude"
        ]
    },
    {
        "category": "Current Affairs Focus Areas",
        "topics": [
            "One Nation One Election",
            "Uniform Civil Code",
            "Cryptocurrency Regulation",
            "Data Protection Bill",
            "Farm Laws and MSP",
            "Ayushman Bharat",
            "PLI Schemes",
            "Green Hydrogen Mission"
        ]
    }
]

@app.get("/api/upsc-suggested-topics")
async def get_upsc_suggested_topics():
    """Get UPSC-specific suggested topics"""
    return {"suggested_topics": UPSC_SUGGESTED_TOPICS}

# Saved Generations API Endpoints
@app.post("/api/save-generation")
async def save_generation(generation: SavedGenerationRequest):
    """Save a generated mind map"""
    import uuid
    from datetime import datetime

    generation_id = str(uuid.uuid4())
    saved_gen = {
        "id": generation_id,
        "user_id": generation.user_id,
        "topic": generation.topic,
        "preparation_stage": generation.preparation_stage,
        "focus_areas": generation.focus_areas,
        "mindmap_data": generation.mindmap_data,
        "generation_time": generation.generation_time,
        "created_at": datetime.utcnow().isoformat()
    }

    saved_generations.append(saved_gen)
    save_saved_generations()  # Persist to file
    return {"message": "Generation saved successfully", "id": generation_id}

@app.get("/api/saved-generations")
async def get_saved_generations(user_id: str = "anonymous"):
    """Get all saved generations for a user"""
    user_generations = [gen for gen in saved_generations if gen["user_id"] == user_id]
    # Sort by creation date (newest first)
    user_generations.sort(key=lambda x: x["created_at"], reverse=True)
    return {"generations": user_generations}

@app.delete("/api/saved-generations/{generation_id}")
async def delete_saved_generation(generation_id: str, user_id: str = "anonymous"):
    """Delete a saved generation"""
    global saved_generations
    initial_count = len(saved_generations)
    saved_generations = [
        gen for gen in saved_generations
        if not (gen["id"] == generation_id and gen["user_id"] == user_id)
    ]

    if len(saved_generations) < initial_count:
        save_saved_generations()  # Persist changes to file
        return {"message": "Generation deleted successfully"}
    else:
        raise HTTPException(status_code=404, detail="Generation not found")

@app.get("/api/saved-generations/{generation_id}")
async def get_saved_generation(generation_id: str, user_id: str = "anonymous"):
    """Get a specific saved generation"""
    for gen in saved_generations:
        if gen["id"] == generation_id and gen["user_id"] == user_id:
            return gen
    raise HTTPException(status_code=404, detail="Generation not found")

@app.get("/api/upsc-tips/{topic}")
async def get_preparation_tips(topic: str):
    """Get UPSC preparation tips for a specific topic"""
    tips_prompt = f"""
    Provide 5 concise UPSC preparation tips for the topic '{topic}'.
    Include:
    1. Key areas to focus
    2. Important current affairs angles
    3. Answer writing approach
    4. Common mistakes to avoid
    5. Recommended study resources
    
    Format as a JSON array of tip objects with 'title' and 'description'.
    """
    
    response = llm.invoke([HumanMessage(content=tips_prompt)])
    
    try:
        tips = json.loads(response.content)
        return {"topic": topic, "tips": tips}
    except:
        return {"topic": topic, "tips": []}

@app.post("/api/generate-mcq", response_model=MCQGenerationResponse)
async def generate_mcqs(request: MCQGenerationRequest):
    """Generate MCQs for a given topic"""
    try:
        mcqs = generate_mcqs_for_topic(request.topic)
        
        # Convert to proper format
        formatted_mcqs = []
        for mcq in mcqs:
            formatted_mcqs.append(MCQItem(
                question=mcq.get("question", ""),
                options=mcq.get("options", []),
                answer=mcq.get("answer", ""),
                explanation=mcq.get("explanation", "")
            ))
        
        return MCQGenerationResponse(
            topic=request.topic,
            mcqs=formatted_mcqs
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating MCQs: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)