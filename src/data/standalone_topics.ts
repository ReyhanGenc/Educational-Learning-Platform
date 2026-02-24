
export interface StandaloneTopic {
    id: string;
    title: string;
    category: string;
    image: string;
    description: string;
    content: string;
}

export const STANDALONE_TOPICS: StandaloneTopic[] = [
    {
        id: "topic-vector-fields",
        title: "Understanding Vector Fields",
        category: "Mathematics",
        image: "https://picsum.photos/1200/800?random",
        description: "A deep dive into the visualization and calculation of vectors in multi-dimensional space.",
        content: `
      <div class="space-y-8">
        <h2 class="text-3xl font-black text-slate-900 uppercase">The Geometry of Force</h2>
        <p class="text-lg text-slate-700 leading-relaxed font-medium">In this standalone explanation, we explore how vector fields represent forces. Unlike course-specific units, this topic focuses on the high-level intuition behind the math.</p>
        <img src="https://picsum.photos/1200/800?random" class="w-full rounded-3xl shadow-lg" />
        <p class="text-slate-600 leading-relaxed">Consider a wind map. Every point on the map has a direction (where the wind is blowing) and a magnitude (how fast). This is a classical vector field.</p>
      </div>
    `
    },
    {
        id: "topic-linear-algebra-subspaces",
        title: "The Logic of Subspaces",
        category: "Mathematics",
        image: "https://picsum.photos/1200/800?random",
        description: "Explore why subspaces are the foundational buildings blocks of all linear transformations.",
        content: `
      <div class="space-y-8">
        <h2 class="text-3xl font-black text-slate-900 uppercase">Defining Subspaces</h2>
        <p class="text-lg text-slate-700 leading-relaxed font-medium">This topic explanation breaks down the complex rules of closure into visible, geometric examples.</p>
        <div class="p-8 bg-slate-900 text-white rounded-[32px] italic">
          "A subspace is simply a smaller vector space that lives inside a larger one, playing by the same rules but in a more restricted domain."
        </div>
      </div>
    `
    },
    {
        id: "topic-dna-structure",
        title: "DNA: The Blueprint of Life",
        category: "Biology",
        image: "https://picsum.photos/1200/800?random",
        description: "A comprehensive look at the discovery and chemistry of the Double Helix structure.",
        content: `
      <div class="space-y-8">
        <h2 class="text-3xl font-black text-slate-900 uppercase">Chemical Foundations</h2>
        <p class="text-lg text-slate-700 leading-relaxed font-medium">Beyond the basic curriculum, this explanation looks at the hydrogen bonds that hold our genetic code together.</p>
        <img src="https://picsum.photos/1200/800?random" class="w-full rounded-3xl shadow-lg" />
      </div>
    `
    }
];
