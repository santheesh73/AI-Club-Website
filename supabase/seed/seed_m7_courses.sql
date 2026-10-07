-- ============================================================================
-- AI CLUB — MILESTONE 7 SEED FIXTURES
-- Realistic Course Catalog, Modules, Lessons, and Categories
-- ============================================================================

-- 1. Insert Course Categories
INSERT INTO public.course_categories (id, name, slug, description)
VALUES
  ('c1000000-0000-0000-0000-000000000001', 'AI & Machine Learning', 'ai-machine-learning', 'Deep learning, neural architectures, computer vision, and NLP.'),
  ('c1000000-0000-0000-0000-000000000002', 'Programming & Systems', 'programming-systems', 'Modern software engineering, Python, C++, and systems programming.'),
  ('c1000000-0000-0000-0000-000000000003', 'Data Science & Analytics', 'data-science-analytics', 'Statistical inference, large-scale data wrangling, and feature engineering.'),
  ('c1000000-0000-0000-0000-000000000004', 'Cloud & MLOps', 'cloud-mlops', 'Production deployment, model serving, CI/CD, and infrastructure orchestration.')
ON CONFLICT (slug) DO NOTHING;

-- 2. Insert Courses
INSERT INTO public.courses (
  id,
  title,
  slug,
  short_description,
  description,
  thumbnail_url,
  category_id,
  difficulty,
  estimated_duration,
  status,
  published_at
)
VALUES
  (
    'c2000000-0000-0000-0000-000000000001',
    'Foundations of Deep Learning & PyTorch',
    'foundations-of-deep-learning-pytorch',
    'Master fundamental neural network theory, forward propagation, autograd, and loss optimization using PyTorch.',
    'This intensive foundational course takes members from raw matrix calculus to training deep neural networks. You will master tensor operations, build computation graphs, implement backpropagation from scratch, and leverage PyTorch nn.Module primitives for production-ready models.',
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    'c1000000-0000-0000-0000-000000000001',
    'beginner',
    180,
    'published',
    NOW() - INTERVAL '10 days'
  ),
  (
    'c2000000-0000-0000-0000-000000000002',
    'Building Production LLM Agents with Tool Calling',
    'building-production-llm-agents',
    'Design autonomous multi-agent systems with function calling, persistent state memory, and sandbox execution.',
    'Learn how to architect resilient LLM agents capable of multi-step reasoning, external tool execution, structured JSON synthesis, and recursive error recovery. We will examine ReAct patterns, LangChain/LangGraph internals, and secure code sandboxes.',
    'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=800&q=80',
    'c1000000-0000-0000-0000-000000000001',
    'intermediate',
    240,
    'published',
    NOW() - INTERVAL '5 days'
  ),
  (
    'c2000000-0000-0000-0000-000000000003',
    'MLOps: Deploying Scalable AI Services',
    'mlops-deploying-scalable-ai-services',
    'End-to-end deployment of deep learning models with Triton inference server, Docker, and Kubernetes.',
    'Transform laboratory prototypes into enterprise-grade, low-latency microservices. Covers hardware acceleration with TensorRT, dynamic batching, asynchronous RPC endpoints, continuous evaluation, and drift detection.',
    'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=800&q=80',
    'c1000000-0000-0000-0000-000000000004',
    'advanced',
    300,
    'published',
    NOW() - INTERVAL '2 days'
  ),
  (
    'c2000000-0000-0000-0000-000000000004',
    'Quantum Computing for Machine Learning',
    'quantum-computing-for-ml',
    'Exploration of parameterized quantum circuits and variational quantum classifiers for machine learning.',
    'Internal draft syllabus exploring the convergence of quantum information theory and modern machine learning. Explores Qubits, Bloch spheres, PennyLane, and Quantum Neural Networks.',
    NULL,
    'c1000000-0000-0000-0000-000000000001',
    'advanced',
    120,
    'draft',
    NULL
  )
ON CONFLICT (slug) DO NOTHING;

-- 3. Insert Modules for Course 1 (PyTorch)
INSERT INTO public.course_modules (id, course_id, title, description, position)
VALUES
  (
    'm1000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000001',
    'Module 1: Tensors and Computational Graphs',
    'Mathematical representations, tensor broadcasting, GPU device transfer, and automatic differentiation.',
    1
  ),
  (
    'm1000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000001',
    'Module 2: Building Neural Networks with torch.nn',
    'Dense architectures, activation functions, loss optimizers, and gradient descent iterations.',
    2
  )
ON CONFLICT DO NOTHING;

-- 4. Insert Lessons for Course 1 Modules
INSERT INTO public.course_lessons (
  id,
  module_id,
  title,
  slug,
  description,
  content,
  content_type,
  duration,
  position,
  is_preview
)
VALUES
  (
    'l1000000-0000-0000-0000-000000000001',
    'm1000000-0000-0000-0000-000000000001',
    'Introduction to PyTorch Tensors',
    'intro-to-pytorch-tensors',
    'Understanding multidimensional arrays, strides, device allocations, and memory layouts.',
    '# Introduction to PyTorch Tensors

Tensors are the fundamental data structure in PyTorch. Similar to NumPy ndarrays, tensors can run on hardware accelerators like GPUs or TPUs.

```python
import torch

# Creating a 2D tensor
x = torch.tensor([[1.0, 2.0], [3.0, 4.0]], dtype=torch.float32)
print("Tensor shape:", x.shape)
print("Device:", x.device)
```

### Key Properties
1. **Shape & Stride**: How data is represented in continuous memory.
2. **Dtype**: Float32, Float16, BFloat16, or Int64.
3. **Device**: CPU vs CUDA vs MPS.',
    'text',
    15,
    1,
    true
  ),
  (
    'l1000000-0000-0000-0000-000000000002',
    'm1000000-0000-0000-0000-000000000001',
    'Autograd: Automatic Differentiation Engine',
    'autograd-automatic-differentiation',
    'Reverse-mode automatic differentiation in PyTorch using requires_grad and backward().',
    '# Autograd Engine

PyTorch uses reverse-mode automatic differentiation (`autograd`). Every tensor with `requires_grad=True` tracks operations executed on it to build a directed acyclic graph (DAG).

```python
x = torch.ones(2, 2, requires_grad=True)
y = x + 2
z = y * y * 3
out = z.mean()

# Compute gradients
out.backward()
print(x.grad)
```

Gradients accumulate into the `.grad` attribute of leaves in the computation graph.',
    'text',
    20,
    2,
    false
  ),
  (
    'l1000000-0000-0000-0000-000000000003',
    'm1000000-0000-0000-0000-000000000002',
    'Constructing Custom Models with nn.Module',
    'constructing-custom-models-nn-module',
    'Subclassing nn.Module, defining layer parameters, and wiring forward passes.',
    '# Constructing Neural Networks with nn.Module

To build custom neural architectures in PyTorch, subclass `torch.nn.Module` and define the `__init__` and `forward` methods:

```python
import torch.nn as nn
import torch.nn.functional as F

class MultiLayerPerceptron(nn.Module):
    def __init__(self, in_features, hidden_dim, num_classes):
        super().__init__()
        self.fc1 = nn.Linear(in_features, hidden_dim)
        self.relu = nn.ReLU()
        self.fc2 = nn.Linear(hidden_dim, num_classes)

    def forward(self, x):
        x = self.relu(self.fc1(x))
        return self.fc2(x)
```',
    'text',
    25,
    1,
    false
  ),
  (
    'l1000000-0000-0000-0000-000000000004',
    'm1000000-0000-0000-0000-000000000002',
    'The Training Loop and Optimization',
    'the-training-loop-and-optimization',
    'Loss functions, Adam optimizer, zero_grad, backward, and step calls.',
    '# The PyTorch Training Loop

A standard training loop coordinates the forward pass, loss calculation, backward pass, and parameter update:

```python
optimizer = torch.optim.Adam(model.parameters(), lr=1e-3)
criterion = nn.CrossEntropyLoss()

for epoch in range(num_epochs):
    for batch_x, batch_y in dataloader:
        optimizer.zero_grad()
        predictions = model(batch_x)
        loss = criterion(predictions, batch_y)
        loss.backward()
        optimizer.step()
```',
    'text',
    30,
    2,
    false
  )
ON CONFLICT DO NOTHING;

-- 5. Insert Modules and Lessons for Course 2 (LLM Agents)
INSERT INTO public.course_modules (id, course_id, title, description, position)
VALUES
  (
    'm2000000-0000-0000-0000-000000000001',
    'c2000000-0000-0000-0000-000000000002',
    'Module 1: ReAct & Cognitive Architectures',
    'Core mechanics of reasoning + acting paradigms in LLM orchestration.',
    1
  ),
  (
    'm2000000-0000-0000-0000-000000000002',
    'c2000000-0000-0000-0000-000000000002',
    'Module 2: Structured Outputs & Function Calling',
    'Schema enforcement, Pydantic validation, and dynamic tool dispatch.',
    2
  )
ON CONFLICT DO NOTHING;

INSERT INTO public.course_lessons (
  id,
  module_id,
  title,
  slug,
  description,
  content,
  content_type,
  duration,
  position,
  is_preview
)
VALUES
  (
    'l2000000-0000-0000-0000-000000000001',
    'm2000000-0000-0000-0000-000000000001',
    'The ReAct Framework: Thought, Action, Observation',
    'the-react-framework-thought-action-observation',
    'Decomposing complex queries into cyclic reasoning, acting, and observing steps.',
    '# The ReAct Paradigm

ReAct (Reasoning and Acting) combines prompt engineering with environmental feedback:

1. **Thought**: The model plans what operation to perform.
2. **Action**: The model emits a tool call name and arguments.
3. **Observation**: The execution environment executes the tool and feeds back the result.
4. **Conclusion**: The model synthesizes the answer or determines the next step.',
    'text',
    20,
    1,
    true
  ),
  (
    'l2000000-0000-0000-0000-000000000002',
    'm2000000-0000-0000-0000-000000000002',
    'Function Calling with Schema Enforcement',
    'function-calling-with-schema-enforcement',
    'Defining JSON schemas for deterministic tool execution and validation.',
    '# Function Calling with Schemas

Modern foundation models support native JSON schema tool declarations:

```json
{
  "name": "calculate_matrix_eigenvalues",
  "description": "Calculates the eigenvalues of an NxN numeric matrix.",
  "parameters": {
    "type": "object",
    "properties": {
      "matrix": { "type": "array", "items": { "type": "array", "items": { "type": "number" } } }
    },
    "required": ["matrix"]
  }
}
```',
    'text',
    25,
    1,
    false
  )
ON CONFLICT DO NOTHING;
