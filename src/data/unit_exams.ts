
export interface UnitQuestion {
    question_text: string;
    options: { id: string; label: string }[];
    correct_option_id: string;
}

export const UNIT_EXAMS: Record<string, UnitQuestion[]> = {
    // Vector Fields Lesson
    "0b51629f-cd6a-466a-9485-8d9088eef115": [
        {
            question_text: "What does the divergence of a vector field represent at a given point?",
            options: [
                { id: "A", label: "The circulation density around the point" },
                { id: "B", label: "The net outward flow per unit volume" },
                { id: "C", label: "The magnitude of the force vector" },
                { id: "D", label: "The curvature of the field lines" }
            ],
            correct_option_id: "B"
        },
        {
            question_text: "In the 2D vector field F(x, y) = P i + Q j, what is the formula for divergence?",
            options: [
                { id: "A", label: "dP/dx + dQ/dy" },
                { id: "B", label: "dP/dy - dQ/dx" },
                { id: "C", label: "dP/dx * dQ/dy" },
                { id: "D", label: "P*x + Q*y" }
            ],
            correct_option_id: "A"
        }
    ],
    // Subspaces Lesson
    "acc8700e-35f9-4e3c-97ec-9c71b45b6e8a": [
        {
            question_text: "Which of the following is NOT a required condition for a set to be a subspace?",
            options: [
                { id: "A", label: "Contains the zero vector" },
                { id: "B", label: "Closed under vector addition" },
                { id: "C", label: "Contains only unit vectors" },
                { id: "D", label: "Closed under scalar multiplication" }
            ],
            correct_option_id: "C"
        }
    ],
    // Matrix Representation
    "4cbdc691-d3bf-4af8-bdd7-920b85638bdb": [
        {
            question_text: "In linear transformations, what does it mean if a matrix has a determinant of zero?",
            options: [
                { id: "A", label: "The transformation is a pure rotation" },
                { id: "B", label: "The transformation collapses space to a lower dimension" },
                { id: "C", label: "The transformation is an identity matrix" },
                { id: "D", label: "The transformation doubles the area" }
            ],
            correct_option_id: "B"
        }
    ],
    // Double Helix Discovery
    "53315f86-16b9-44d3-8e8b-43f900d872a1": [
        {
            question_text: "Who produced the 'Photograph 51' which proved the helical structure of DNA?",
            options: [
                { id: "A", label: "James Watson" },
                { id: "B", label: "Francis Crick" },
                { id: "C", label: "Rosalind Franklin" },
                { id: "D", label: "Linus Pauling" }
            ],
            correct_option_id: "C"
        }
    ],
    // Replication Mechanisms
    "75381559-c3f5-4539-bef6-625db89ba416": [
        {
            question_text: "Which enzyme is responsible for 'unzipping' the DNA double helix during replication?",
            options: [
                { id: "A", label: "DNA Polymerase" },
                { id: "B", label: "Helicase" },
                { id: "C", label: "Ligase" },
                { id: "D", label: "Primase" }
            ],
            correct_option_id: "B"
        }
    ],
    // Breadth-First Search (BFS)
    "db41bea5-503f-43b6-bf05-1bf59b008a74": [
        {
            question_text: "What data structure does BFS use primarily for its level-order exploration?",
            options: [
                { id: "A", label: "Stack (LIFO)" },
                { id: "B", label: "Queue (FIFO)" },
                { id: "C", label: "Priority Queue" },
                { id: "D", label: "Linked List" }
            ],
            correct_option_id: "B"
        }
    ],
    // Depth-First Search (DFS)
    "04b83458-2ac2-4626-b715-6830aab86db1": [
        {
            question_text: "DFS is most commonly implemented using which of the following?",
            options: [
                { id: "A", label: "Iteration with a Queue" },
                { id: "B", label: "Recursion (or a Stack)" },
                { id: "C", label: "Linear Search" },
                { id: "D", label: "Binary Tree" }
            ],
            correct_option_id: "B"
        }
    ]
};
