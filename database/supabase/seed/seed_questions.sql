-- ==============================================================================
-- AI CLUB - 52 Curated Assessment Questions Seed
-- File: seed_questions.sql
-- Categories: AI Fundamentals, Machine Learning, Python / Programming,
--             Data Science, Deep Learning, Generative AI, Logical Reasoning
-- ==============================================================================

INSERT INTO public.assessment_questions 
    (question_text, category, difficulty, option_a, option_b, option_c, option_d, correct_option, marks, is_active)
VALUES
-- AI Fundamentals (1-7)
(
    'Which algorithm is considered an uninformed (blind) search algorithm?',
    'AI Fundamentals', 'easy',
    'A* Search', 'Breadth-First Search (BFS)', 'Greedy Best-First Search', 'Minimax with Alpha-Beta Pruning',
    'B', 1.0, true
),
(
    'What does the Turing Test specifically aim to evaluate?',
    'AI Fundamentals', 'easy',
    'A machine''s processing speed', 'A machine''s ability to exhibit intelligent behavior indistinguishable from a human', 'A neural network''s parameter count', 'The algorithmic complexity of a search tree',
    'B', 1.0, true
),
(
    'In an adversarial game search like chess, what is the primary role of Alpha-Beta pruning?',
    'AI Fundamentals', 'medium',
    'To increase the depth of the game tree by generating random moves', 'To decrease the number of nodes evaluated by the minimax algorithm without altering the result', 'To approximate continuous variables using gradient descent', 'To backpropagate errors across layers',
    'B', 1.0, true
),
(
    'Which property guarantees that an A* heuristic never overestimates the true cost to reach the goal?',
    'AI Fundamentals', 'medium',
    'Monotonicity', 'Completeness', 'Admissibility', 'Dominance',
    'C', 1.0, true
),
(
    'In Markov Decision Processes (MDP), what does the Markov property state?',
    'AI Fundamentals', 'medium',
    'The future state depends only upon the current state and action, not on the sequence of preceding events', 'All rewards must be strictly non-negative', 'The optimal policy is always stochastic', 'The environment must have deterministic transitions only',
    'A', 1.0, true
),
(
    'What is the primary trade-off controlled by the discount factor (gamma) in reinforcement learning?',
    'AI Fundamentals', 'medium',
    'Exploration vs. exploitation rate', 'Immediate rewards vs. long-term future rewards', 'Supervised loss vs. unsupervised clustering', 'Model size vs. inference latency',
    'B', 1.0, true
),
(
    'Which search strategy always expands the shallowest unexpanded node first?',
    'AI Fundamentals', 'easy',
    'Depth-First Search', 'Breadth-First Search', 'Depth-Limited Search', 'Uniform Cost Search with non-zero costs',
    'B', 1.0, true
),

-- Machine Learning (8-15)
(
    'What symptom is typically indicative of high variance (overfitting) in a machine learning model?',
    'Machine Learning', 'easy',
    'High training error and high test error', 'Low training error and high test error', 'Low training error and low test error', 'High training error and low test error',
    'B', 1.0, true
),
(
    'Which metric is preferred when evaluating a binary classifier on an extremely imbalanced dataset (e.g. 99.5% negative class)?',
    'Machine Learning', 'medium',
    'Accuracy', 'Precision-Recall AUC (PR-AUC)', 'Mean Squared Error', 'Adjusted R-squared',
    'B', 1.0, true
),
(
    'What is the primary mathematical difference between L1 (Lasso) and L2 (Ridge) regularization?',
    'Machine Learning', 'medium',
    'L1 penalizes sum of squared weights, leading to distributed weights', 'L1 penalizes sum of absolute weights, driving irrelevant feature weights to zero', 'L2 creates exact sparse models, whereas L1 shrinks smoothly', 'L2 is non-differentiable at zero',
    'B', 1.0, true
),
(
    'Which ensemble method trains base learners in a sequential manner, where each subsequent model attempts to correct the errors of its predecessor?',
    'Machine Learning', 'easy',
    'Bagging', 'Boosting', 'Random Forest', 'Stochastic Feature Selection',
    'B', 1.0, true
),
(
    'What does the kernel trick in Support Vector Machines (SVM) allow the algorithm to do?',
    'Machine Learning', 'medium',
    'Train neural network weights via backwards differentiation', 'Operate in a high-dimensional feature space without explicitly computing the coordinates of the data in that space', 'Compress support vectors into discrete quantization bins', 'Perform multi-class classification using single-layer perceptrons',
    'B', 1.0, true
),
(
    'Which distance metric is most appropriate for high-dimensional sparse text vectors (such as TF-IDF representations)?',
    'Machine Learning', 'easy',
    'Euclidean Distance', 'Manhattan Distance', 'Cosine Similarity', 'Hamming Distance',
    'C', 1.0, true
),
(
    'In K-Means clustering, what is the standard method used to select the optimal number of clusters (K)?',
    'Machine Learning', 'easy',
    'ROC-AUC curve', 'Elbow Method using Inertia / WCSS', 'Confusion Matrix Analysis', 'Backpropagation gradient check',
    'B', 1.0, true
),
(
    'What does the Bias-Variance tradeoff imply when increasing model complexity?',
    'Machine Learning', 'medium',
    'Bias decreases while variance increases', 'Bias increases while variance decreases', 'Both bias and variance increase', 'Both bias and variance decrease to zero',
    'A', 1.0, true
),

-- Python & Programming (16-23)
(
    'In Python, what is the time complexity of checking membership (`x in s`) where `s` is a built-in `set` on average?',
    'Python / Programming', 'easy',
    'O(N)', 'O(log N)', 'O(1)', 'O(N log N)',
    'C', 1.0, true
),
(
    'Which of the following creates a generator in Python rather than constructing an in-memory list?',
    'Python / Programming', 'medium',
    '[x * 2 for x in range(1000)]', '(x * 2 for x in range(1000))', '{x * 2 for x in range(1000)}', '{x: x * 2 for x in range(1000)}',
    'B', 1.0, true
),
(
    'What is the output of `bool([])`, `bool([0])`, `bool("")` in Python?',
    'Python / Programming', 'easy',
    'False, False, False', 'False, True, False', 'True, True, False', 'False, True, True',
    'B', 1.0, true
),
(
    'In Python, what does the Global Interpreter Lock (GIL) primarily restrict in CPython?',
    'Python / Programming', 'medium',
    'Multiple processes from sharing disk storage', 'Multiple native OS threads from executing Python bytecode simultaneously on multiple CPU cores', 'Asynchronous event loops from scheduling coroutines', 'C extension modules from allocating heap memory',
    'B', 1.0, true
),
(
    'What does the `@property` decorator achieve in Python classes?',
    'Python / Programming', 'easy',
    'Turns a method into an asynchronous coroutine', 'Allows a method to be accessed like an attribute with getter/setter support', 'Prevents subclasses from overriding the method', 'Ensures thread-safe synchronized execution',
    'B', 1.0, true
),
(
    'Which numpy operation performs vectorized element-wise multiplication between two arrays of identical dimensions `A` and `B`?',
    'Python / Programming', 'easy',
    'np.dot(A, B)', 'A * B', 'A @ B', 'np.matmul(A, B)',
    'B', 1.0, true
),
(
    'What is the consequence of passing a mutable object (like a list `[]`) as a default argument in a Python function definition?',
    'Python / Programming', 'medium',
    'A TypeError is raised at compile time', 'A new empty list is created every time the function is called without arguments', 'The same list instance is shared across subsequent calls that do not provide that parameter', 'The list is converted into an immutable tuple',
    'C', 1.0, true
),
(
    'In Python 3.10+, which syntax provides structural pattern matching?',
    'Python / Programming', 'easy',
    'switch ... case', 'match ... case', 'select ... when', 'when ... then',
    'B', 1.0, true
),

-- Data Science & Statistics (24-30)
(
    'What is the Central Limit Theorem (CLT) fundamental assertion?',
    'Data Science', 'medium',
    'Any population distribution must be normal if sample size exceeds 10', 'The distribution of the sample mean approaches a normal distribution as sample size increases, regardless of population shape', 'Sample variance always equals population variance', 'The median and mode always converge for symmetric distributions',
    'B', 1.0, true
),
(
    'What does a p-value of 0.02 indicate assuming a standard significance threshold of alpha = 0.05?',
    'Data Science', 'easy',
    'The null hypothesis is proven with 98% certainty', 'There is sufficient evidence to reject the null hypothesis in favor of the alternative hypothesis', 'The effect size is exactly 0.02 units', 'The study suffered from Type II error',
    'B', 1.0, true
),
(
    'In a Pandas DataFrame, what does the method `.dropna(axis=1)` do?',
    'Data Science', 'easy',
    'Drops rows containing null values', 'Drops columns containing null values', 'Fills missing values with the column mean', 'Drops duplicate indices across columns',
    'B', 1.0, true
),
(
    'What does Principal Component Analysis (PCA) aim to maximize when projecting data onto new orthogonal axes?',
    'Data Science', 'medium',
    'The classification accuracy of a logistic regression', 'The variance of the data along the principal axes', 'The sparsity of the feature matrix', 'The mutual information between features and target labels',
    'B', 1.0, true
),
(
    'Which statistical measure represents the degree to which two random variables change together linearly?',
    'Data Science', 'easy',
    'Kurtosis', 'Covariance', 'Skewness', 'Standard Deviation',
    'B', 1.0, true
),
(
    'In feature scaling, what distinguishes Min-Max Normalization from Standardization (Z-score)?',
    'Data Science', 'medium',
    'Standardization bounds values strictly between [0, 1], whereas Min-Max has no bounds', 'Min-Max scales features to a fixed range (typically 0 to 1), whereas Standardization scales to mean=0 and variance=1', 'Min-Max is immune to outliers', 'Standardization requires positive values only',
    'B', 1.0, true
),
(
    'What problem occurs when independent variables in a regression model are highly correlated with one another?',
    'Data Science', 'easy',
    'Heteroskedasticity', 'Multicollinearity', 'Underfitting', 'Autocorrelation',
    'B', 1.0, true
),

-- Deep Learning (31-38)
(
    'What is the primary advantage of the ReLU activation function over the Sigmoid function in deep feedforward networks?',
    'Deep Learning', 'easy',
    'ReLU outputs values bounded between -1 and 1', 'ReLU mitigates the vanishing gradient problem for positive input values', 'ReLU is continuously differentiable everywhere including at zero', 'ReLU eliminates the need for weight initialization',
    'B', 1.0, true
),
(
    'In Convolutional Neural Networks (CNNs), what is the primary purpose of a Pooling layer (e.g. Max Pooling)?',
    'Deep Learning', 'easy',
    'To introduce non-linearity between convolutional layers', 'To reduce spatial dimensions (width and height), reducing computation and providing translation invariance', 'To increase the number of feature channels', 'To compute the loss gradient with respect to class labels',
    'B', 1.0, true
),
(
    'What mechanism does Batch Normalization use during training to stabilize network optimization?',
    'Deep Learning', 'medium',
    'Normalizes layer inputs across the mini-batch to zero mean and unit variance, followed by learnable scale and shift parameters', 'Stochastically zeroes out activations with probability p', 'Clips gradients above a fixed norm threshold', 'Weights samples inversely proportional to class frequency',
    'A', 1.0, true
),
(
    'What problem does the residual connection (skip connection) solve in ResNet architectures?',
    'Deep Learning', 'medium',
    'Overfitting due to excessive parameter counts', 'Degradation problem / vanishing gradients in very deep networks by allowing identity mappings', 'High inference memory footprint', 'Inability to process variable sequence lengths',
    'B', 1.0, true
),
(
    'Which optimization algorithm computes adaptive learning rates for each parameter using both first and second moments of gradients?',
    'Deep Learning', 'easy',
    'Stochastic Gradient Descent (Vanilla SGD)', 'Adam (Adaptive Moment Estimation)', 'AdaGrad without momentum', 'Mini-batch Momentum SGD',
    'B', 1.0, true
),
(
    'What is the formula for the scaled dot-product attention in the Transformer architecture?',
    'Deep Learning', 'medium',
    'Softmax(Q * K^T / sqrt(d_k)) * V', 'Softmax(Q * V^T / d_k) * K', 'Sigmoid(W * [Q, K]) * V', 'Tanh(Q * K) * V',
    'A', 1.0, true
),
(
    'What is the function of Dropout during training of deep neural networks?',
    'Deep Learning', 'easy',
    'Accelerates GPU matrix multiplication', 'Acts as a regularization technique by randomly deactivating neurons to prevent co-adaptation', 'Normalizes gradient norms across batches', 'Automatically schedules learning rate decays',
    'B', 1.0, true
),
(
    'Why are Recurrent Neural Networks (RNNs) susceptible to the vanishing gradient problem over long sequences?',
    'Deep Learning', 'medium',
    'Because hidden states are computed via non-linear convolutions', 'Because backpropagation through time involves repeated matrix multiplications by transition weights across timesteps', 'Because activation functions must be strictly linear', 'Because attention matrices grow quadratically',
    'B', 1.0, true
),

-- Generative AI & LLMs (39-45)
(
    'In Large Language Models, what does the Temperature parameter control during text generation sampling?',
    'Generative AI', 'easy',
    'The learning rate during fine-tuning', 'The randomness / sharpness of the output probability distribution over the vocabulary', 'The maximum context window length', 'The number of transformer attention heads',
    'B', 1.0, true
),
(
    'What is the primary architectural concept behind LoRA (Low-Rank Adaptation) for fine-tuning LLMs?',
    'Generative AI', 'medium',
    'Pruning attention weights that are close to zero', 'Freezing pretrained weights and injecting trainable low-rank decomposition matrices into model layers', 'Quantizing weights to 1-bit representations', 'Distilling knowledge from a large model into an LSTM',
    'B', 1.0, true
),
(
    'What does RAG (Retrieval-Augmented Generation) augment an LLM with?',
    'Generative AI', 'easy',
    'External knowledge retrieved dynamically from a vector database or document store', 'Additional pre-training compute cycles on public web text', 'Reinforcement learning feedback from human labelers', 'Larger positional embedding dimensions',
    'A', 1.0, true
),
(
    'In diffusion models (e.g. Stable Diffusion), what is the reverse process designed to accomplish?',
    'Generative AI', 'medium',
    'Incrementally adding Gaussian noise to a clean image', 'Iteratively removing predicted noise from a noisy latent tensor to reconstruct a clean sample', 'Generating text tokens autoregressively from left to right', 'Maximizing discriminator cross-entropy loss',
    'B', 1.0, true
),
(
    'What is the quadratic computational bottleneck in the standard self-attention mechanism with respect to sequence length N?',
    'Generative AI', 'easy',
    'O(N) memory and compute', 'O(N^2) memory and compute for attention matrix computation', 'O(N^3) matrix inversion cost', 'O(log N) tree traversal cost',
    'B', 1.0, true
),
(
    'What distinguishes RLHF (Reinforcement Learning from Human Feedback) from standard supervised fine-tuning?',
    'Generative AI', 'medium',
    'RLHF does not use any human data', 'RLHF trains a reward model based on human preference comparisons to optimize policy via PPO/DPO', 'RLHF can only be used on vision models', 'RLHF permanently freezes vocabulary embeddings',
    'B', 1.0, true
),
(
    'What does the "hallucination" phenomenon refer to in generative language models?',
    'Generative AI', 'easy',
    'Model inference encountering out-of-memory errors', 'The model generating plausible-sounding but factually incorrect or fabricated statements with high confidence', 'When weights collapse to NaN during backpropagation', 'When the tokenizer fails to parse non-ASCII characters',
    'B', 1.0, true
),

-- Logical Reasoning & Problem Solving (46-52)
(
    'If all AI engineers write code, and some code writers understand category theory, what can be logically deduced with absolute certainty?',
    'Logical Reasoning', 'medium',
    'All AI engineers understand category theory', 'Some AI engineers may or may not understand category theory', 'No AI engineers understand category theory', 'All category theory scholars are AI engineers',
    'B', 1.0, true
),
(
    'In a binary tree of height H (where a single root node has height 0), what is the maximum number of leaves in the tree?',
    'Problem Solving', 'easy',
    '2^H', '2^(H+1) - 1', 'H^2', '2 * H',
    'A', 1.0, true
),
(
    'A server cluster has 3 identical machines. The probability of each machine failing independently during a day is 0.1. What is the probability that at least one machine remains operational throughout the day?',
    'Problem Solving', 'medium',
    '0.900', '0.999', '0.729', '0.990',
    'B', 1.0, true
),
(
    'You have an unsorted array of N integers. Which algorithmic technique can find the K-th smallest element in O(N) average time?',
    'Problem Solving', 'medium',
    'Merge Sort', 'Quickselect', 'Binary Search over array indices', 'Heap Sort',
    'B', 1.0, true
),
(
    'In Boolean logic, what is the contrapositive of the implication "If a model overfits (P), then validation loss increases (Q)"?',
    'Logical Reasoning', 'easy',
    'If validation loss increases, then the model overfits', 'If validation loss does not increase, then the model does not overfit', 'If a model does not overfit, then validation loss does not increase', 'A model overfits if and only if validation loss increases',
    'B', 1.0, true
),
(
    'What is the minimum number of comparisons required to find both the minimum and maximum of an array of N elements in the worst case?',
    'Problem Solving', 'hard',
    '2N - 2', 'ceil(3N / 2) - 2', 'N log N', 'N - 1',
    'B', 1.0, true
),
(
    'A hash table with load factor alpha = N / M uses chaining. What is the expected time complexity for a search operation assuming simple uniform hashing?',
    'Problem Solving', 'easy',
    'O(N)', 'O(1 + alpha)', 'O(log M)', 'O(N * M)',
    'B', 1.0, true
)
ON CONFLICT (id) DO NOTHING;
