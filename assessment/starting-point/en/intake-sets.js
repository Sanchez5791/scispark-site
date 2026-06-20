'use strict';
/* SciSpark — Learning Starting Point Check · question bank (EN)
   12 LONG-ANSWER / structured questions, split 4 per year level (Y7 / Y8 / Y9).
   Per year: 2 Chemistry + 1 Physics + 1 Biology, one Part C + one Part D.
   Each sub-part is its OWN labelled text box. NO auto-grading, NO answer key,
   NO MCQ. All answers are stored as text for a teacher to mark manually.

   Question text + figures are reused verbatim from the live Y7/Y8/Y9
   assessment papers. Figures live as local files under ./img/. Each box's
   `id` is the original assessment field name, so the teacher's mark scheme
   maps straight onto the stored answers.

   Model:
     { bank, subject, part, topic, stem, figs:[...], parts:[ part ] }
     fig  = { type:'img', src, alt } | { type:'table', html }
     part = { id, letter?, prompt?, lead?, sub?, figs?, ph?, rows? }
       - letter+prompt start a new lettered sub-question
       - a part with no prompt is an extra box under the previous prompt
       - sub = small label printed above that one box
*/

const INTAKE_SETS = {

  /* ───────────────────────── YEAR 7 ───────────────────────── */
  Y7: [
    {
      bank: 'Y7_QC1', subject: 'Chemistry', part: 'C',
      topic: 'Chemical reaction & observation',
      stem: `<p class="spc-stem">Oliver mixes a blue solid with a colourless liquid in a beaker. The mixture turns brown and bubbles appear. He measures the temperature of the mixture every 30 seconds.</p>`,
      figs: [],
      parts: [
        { id:'Y7_QC1_a_answer', letter:'a', prompt:`What apparatus does Oliver use to measure the <strong>volume</strong> of liquid?`, ph:'Type the name of the apparatus' },
        { id:'Y7_QC1_b_answer', letter:'b', prompt:`Why does Oliver <strong>stir</strong> the mixture?`, ph:'Type your answer here' },
        { id:'Y7_QC1_c_answer', letter:'c', prompt:`What colour is the <strong>reactant</strong>? What colour is the <strong>product</strong>?`, ph:'reactant colour → product colour' },
        { id:'Y7_QC1_d_answer', letter:'d', prompt:`What <strong>evidence</strong> shows that a chemical reaction is happening?`, ph:'Type your answer here' },
        { id:'Y7_QC1_f_answer', letter:'f', prompt:`At time 0, the temperature was 5&deg;C. After 5 minutes, the temperature was 1&deg;C. Describe the <strong>trend</strong> in temperature.`, ph:'Describe what happens to the temperature' }
      ]
    },
    {
      bank: 'Y7_QC2', subject: 'Biology', part: 'C',
      topic: 'Bacteria & investigation',
      stem: `<p class="spc-stem">Blessy is a scientist. She investigates how bacteria grow in different solutions. Blessy puts:</p>
        <ul class="spc-bullets">
          <li>the same amount of bacteria in each dish</li>
          <li>the same amount of nutrients in each dish</li>
          <li>water in only one dish</li>
          <li>different strengths of acid in the other dishes</li>
          <li>the dishes in a warm place for five days.</li>
        </ul>`,
      figs: [],
      parts: [
        { id:'Y7_QC2_a_1_answer', letter:'a', prompt:`Write down <strong>two variables</strong> that Blessy controls in her investigation.`, sub:'variable 1', ph:'Type your first variable' },
        { id:'Y7_QC2_a_2_answer', sub:'variable 2', ph:'Type your second variable' },
        { id:'Y7_QC2_b_risk_answer', letter:'b', prompt:`Write down <strong>one risk</strong> and <strong>one way</strong> to reduce this risk in this investigation.`, sub:'risk', ph:'Type a risk' },
        { id:'Y7_QC2_b_reduce_answer', sub:'way to reduce this risk', ph:'Type how to reduce the risk' },
        { id:'Y7_QC2_c_W_answer', letter:'c',
          prompt:`Here are the dishes after five days. Decide which dish contains <strong>water</strong> (W) and which contains the <strong>strongest acid</strong> (A). Use the position of the dish in the diagram, for example: top left, top centre, top right, bottom left, bottom centre, or bottom right.`,
          figs:[{ type:'img', src:'img/y7_bacteria_dishes.jpg', alt:'six bacteria dishes after five days showing different amounts of bacteria growth' }],
          sub:'W (water) is in the … position', ph:'Write a position' },
        { id:'Y7_QC2_c_A_answer', sub:'A (strongest acid) is in the … position', ph:'Write a position' }
      ]
    },
    {
      bank: 'Y7_QD1', subject: 'Chemistry', part: 'D',
      topic: 'Mixtures & reversibility',
      stem: `<p class="spc-stem">Gennaro makes 4 mixtures in 4 beakers.</p>`,
      figs: [{ type:'img', src:'img/y7_four_beakers.jpg', alt:'four beakers A, B, C and D containing cooking oil and water, salt and water, bicarbonate of soda and vinegar, and sugar and water' }],
      parts: [
        { id:'Y7_QD1_a_answer', letter:'a', prompt:`Which mixture is <strong>irreversible</strong>?`, ph:'A, B, C or D' },
        { id:'Y7_QD1_b_answer', letter:'b', prompt:`Explain why that mixture <strong>cannot be reversed</strong>.`, ph:'Type your explanation here' },
        { id:'Y7_QD1_c_answer', letter:'c', prompt:`How can Gennaro get the <strong>salt back</strong> from mixture B (salt + water)?`, ph:'Describe the method' },
        { id:'Y7_QD1_d_answer', letter:'d', prompt:`Describe what happens to mixture <strong>A</strong> (cooking oil + water).`, ph:'Describe what you observe' },
        { id:'Y7_QD1_e_answer', letter:'e', prompt:`Which mixtures are <strong>solutions</strong>? Write the letters of all correct answers.`, ph:'e.g. B and D' }
      ]
    },
    {
      bank: 'Y7_QD3', subject: 'Physics', part: 'D',
      topic: 'Electrical circuits',
      stem: `<p class="spc-stem">Sofia builds an electrical circuit. Here is the circuit.</p>`,
      figs: [{ type:'img', src:'img/y7_circuit.png', alt:'electrical circuit with battery, two lamps, switch and connecting wires' }],
      parts: [
        { id:'Y7_QD3_a_1_answer', letter:'a', prompt:`Name the <strong>four components</strong> in Sofia&rsquo;s circuit.`, sub:'components 1 & 2', ph:'Write two components' },
        { id:'Y7_QD3_a_2_answer', sub:'components 3 & 4', ph:'Write two more components' },
        { id:'Y7_QD3_b_answer', letter:'b', prompt:`When Sofia <strong>closes the switch</strong>, will the lamp light? Explain why.`, ph:'Yes / No — because ...' },
        { id:'Y7_QD3_c_answer', letter:'c', prompt:`What happens to the lamp&rsquo;s brightness if Sofia <strong>adds another cell</strong> to the circuit?`, ph:'The lamp gets ...' },
        { id:'Y7_QD3_d_answer', letter:'d', prompt:`What happens if Sofia <strong>removes the switch</strong> and joins the wires directly?`, ph:'The lamp will ...' }
      ]
    }
  ],

  /* ───────────────────────── YEAR 8 ───────────────────────── */
  Y8: [
    {
      bank: 'Y8_Q26', subject: 'Physics', part: 'C',
      topic: 'Parachute data investigation',
      stem: `<p class="spc-stem">Pierre investigates the time it takes for parachutes of different sizes to fall to the ground. He records his results in a table.</p>`,
      figs: [{ type:'table', html:`<table class="spc-table">
        <thead><tr><th>area of parachute in cm²</th><th>test 1 / s</th><th>test 2 / s</th><th>test 3 / s</th><th>average / s</th></tr></thead>
        <tbody>
          <tr><td>50</td><td>1.7</td><td>1.5</td><td>2.8</td><td>?</td></tr>
          <tr><td>113</td><td>3.0</td><td>3.6</td><td>3.3</td><td>3.3</td></tr>
          <tr><td>201</td><td>6.2</td><td>6.3</td><td>6.7</td><td>6.4</td></tr>
          <tr><td>314</td><td>9.5</td><td>9.9</td><td>10.0</td><td>9.8</td></tr>
        </tbody></table>` }],
      parts: [
        { id:'Y8_QC1a_anomalous_result', letter:'a', prompt:`Write down the anomalous result in the table.`, ph:'answer' },
        { id:'Y8_QC1b_missing_average', letter:'b', prompt:`Calculate the missing average (mean) time in the table.`, ph:'answer' },
        { id:'Y8_QC1c_pattern_explanation', letter:'c', prompt:`Describe the pattern in Pierre&rsquo;s results. Use your scientific knowledge to explain the pattern.`, rows:3, ph:'Type your answer here...' }
      ]
    },
    {
      bank: 'Y8_Q27', subject: 'Chemistry', part: 'C',
      topic: 'Solids added to water',
      stem: `<p class="spc-stem">Ahmed adds water to different solids. Here are his results.</p>`,
      figs: [{ type:'table', html:`<table class="spc-table">
        <thead><tr><th>solid</th><th>colour of solid</th><th>effect of adding water</th></tr></thead>
        <tbody>
          <tr><td>A</td><td>white</td><td>forms a colourless solution</td></tr>
          <tr><td>B</td><td>green</td><td>forms a green solution</td></tr>
          <tr><td>C</td><td>white</td><td>forms a white cloudy mixture</td></tr>
          <tr><td>D</td><td>grey</td><td>fizzes and forms a colourless solution</td></tr>
          <tr><td>E</td><td>white</td><td>forms a colourless solution and gets colder</td></tr>
          <tr><td>F</td><td>blue</td><td>forms a blue solution</td></tr>
        </tbody></table>` }],
      parts: [
        { id:'Y8_QC2a_filtration_solid', letter:'a', prompt:`Only one solid can be separated from water by filtration. Which solid is it?`, ph:'letter' },
        { id:'Y8_QC2b_reverse_change_method', letter:'b', prompt:`There is a reversible change when solid A is added to water. Describe how you could reverse this change.`, ph:'Type your answer here...' },
        { id:'Y8_QC2c_irreversible_solid_letter', letter:'c', prompt:`Two of the solids have an irreversible change when added to water. Write the letter of one of these solids and explain how you can tell from the results.`, sub:'solid letter', ph:'letter' },
        { id:'Y8_QC2c_irreversible_evidence', sub:'how you can tell', ph:'evidence from the results' },
        { id:'Y8_QC2d_burning_gasoline', letter:'d', prompt:`Burning gasoline is another change. Is burning gasoline reversible or irreversible? Explain your answer.`, ph:'Type your answer here...' }
      ]
    },
    {
      bank: 'Y8_Q29', subject: 'Chemistry', part: 'D',
      topic: 'Properties of solids, liquids and gases',
      stem: `<p class="spc-stem">The table below shows some information about solids, liquids and gases. Some boxes are blank and are numbered <strong>(1)</strong> to <strong>(5)</strong>. Fill in each numbered blank using the boxes underneath.</p>`,
      figs: [{ type:'table', html:`<table class="spc-table">
        <thead><tr><th>state</th><th>distance between particles</th><th>movement of particles</th><th>forces between particles</th><th>shape</th></tr></thead>
        <tbody>
          <tr><td>solid</td><td>close together</td><td><strong>(1)</strong></td><td><strong>(2)</strong></td><td>fixed shape</td></tr>
          <tr><td>liquid</td><td>close together</td><td>move slowly in all directions</td><td><strong>(3)</strong></td><td>shape of container</td></tr>
          <tr><td>gas</td><td><strong>(4)</strong></td><td>move quickly in all directions</td><td>very weak</td><td><strong>(5)</strong></td></tr>
        </tbody></table>` }],
      parts: [
        { id:'Y8_QD1_solid_movement', letter:'1', prompt:`Blank (1) — <strong>solid</strong>: movement of particles`, ph:'Type the missing word(s)' },
        { id:'Y8_QD1_solid_forces', letter:'2', prompt:`Blank (2) — <strong>solid</strong>: forces between particles`, ph:'Type the missing word(s)' },
        { id:'Y8_QD1_liquid_forces', letter:'3', prompt:`Blank (3) — <strong>liquid</strong>: forces between particles`, ph:'Type the missing word(s)' },
        { id:'Y8_QD1_gas_distance', letter:'4', prompt:`Blank (4) — <strong>gas</strong>: distance between particles`, ph:'Type the missing word(s)' },
        { id:'Y8_QD1_gas_shape', letter:'5', prompt:`Blank (5) — <strong>gas</strong>: shape`, ph:'Type the missing word(s)' }
      ]
    },
    {
      bank: 'Y8_Q32', subject: 'Biology', part: 'D',
      topic: 'Food web and consumers',
      stem: `<p class="spc-stem">Yuri finds some information about organisms which live in the Amazon rainforest:</p>
        <ul class="spc-bullets">
          <li>Trees produce fruit and nuts.</li>
          <li>Jaguars eat tapirs.</li>
          <li>Boa constrictors eat sloths.</li>
          <li>Macaws, monkeys, agoutis, tapirs and sloths eat the fruit and nuts on the trees.</li>
          <li>Monkeys are eaten by eagles.</li>
        </ul>`,
      figs: [],
      parts: [
        { id:'Y8_QD4_blank1', letter:'a',
          prompt:`Look at the food web diagram below. Write the correct organism name for each numbered blank (1, 2, 3 and 4) shown in the diagram.`,
          figs:[{ type:'img', src:'img/y8_food_web.png', alt:'Amazon rainforest food web with four numbered blanks' }],
          sub:'Blank 1', ph:'organism' },
        { id:'Y8_QD4_blank2', sub:'Blank 2', ph:'organism' },
        { id:'Y8_QD4_blank3', sub:'Blank 3', ph:'organism' },
        { id:'Y8_QD4_blank4', sub:'Blank 4', ph:'organism' },
        { id:'Y8_QD4b_arrows_show', letter:'b', prompt:`What do the arrows in the food web show?`, ph:'Type your answer here...' },
        { id:'Y8_QD4c_primary_consumers_count', letter:'c', prompt:`How many primary consumers are there in this food web?`, ph:'number' },
        { id:'Y8_QD4d_decomposer_example', letter:'d', prompt:`There are decomposers in the rainforest. Name an example of a decomposer.`, ph:'name a decomposer' }
      ]
    }
  ],

  /* ───────────────────────── YEAR 9 ───────────────────────── */
  Y9: [
    {
      bank: 'Y9_Q27', subject: 'Chemistry', part: 'C',
      topic: 'Temperature change in reactions',
      stem: `<p class="spc-stem">Carlos investigates temperature change during reactions. The table shows his results.</p>`,
      figs: [{ type:'table', html:`<table class="spc-table">
        <thead><tr><th>Liquid used</th><th>Start (°C)</th><th>Solid added</th><th>End (°C)</th><th>Change (°C)</th><th>Type</th></tr></thead>
        <tbody>
          <tr><td>copper sulfate solution</td><td>19</td><td>magnesium powder</td><td>30</td><td>—</td><td>—</td></tr>
          <tr><td>dilute ethanoic acid</td><td>19</td><td>sodium carbonate</td><td>12</td><td>−7</td><td>—</td></tr>
          <tr><td>potassium carbonate solution</td><td>18</td><td>citric acid</td><td>14</td><td>—</td><td>—</td></tr>
          <tr><td>dilute sulfuric acid</td><td>18</td><td>magnesium ribbon</td><td>34</td><td>—</td><td>—</td></tr>
        </tbody></table>` }],
      parts: [
        { id:'Y9_Q27a_temperature_changes', letter:'a', prompt:`Complete the three missing changes in temperature (rows 1, 3 and 4). Write all three values.`, ph:'e.g. +11, −4, +16' },
        { id:'Y9_Q27b_reaction_types', letter:'b', prompt:`Complete the type of reaction column using exothermic or endothermic. Write all four reaction types in order.`, ph:'e.g. exothermic, endothermic, ...' },
        { id:'Y9_Q27c_mixture_releases_most_energy', letter:'c', prompt:`Which mixture releases the most energy?`, ph:'Type your answer here' },
        { id:'Y9_Q27d_explanation', letter:'d', prompt:`Explain how you know this mixture releases the most energy.`, ph:'Type your answer here' },
        { id:'Y9_Q27e_reliability', letter:'e', prompt:`What should Carlos do to make his results more reliable?`, ph:'Type your answer here' }
      ]
    },
    {
      bank: 'Y9_Q28', subject: 'Physics', part: 'C',
      topic: 'Pressure investigation',
      stem: `<p class="spc-stem">Azim knows that pressure is related to force and area. He pushes a wooden block into modelling clay to investigate how force and area affect pressure.</p>
        <p class="spc-stem"><strong>Equipment:</strong> wooden blocks with different areas, different masses, modelling clay, a ruler.</p>`,
      figs: [
        { type:'img', src:'img/y9_pressure_1.jpg', alt:'wooden block being pushed into modelling clay' },
        { type:'img', src:'img/y9_pressure_2.jpg', alt:'blocks of different areas and masses used in the investigation' }
      ],
      parts: [
        { id:'Y9_Q28a_plan_place_measure_dent', letter:'a', prompt:`Write an outline plan for his investigation. Use the two boxes below.`, sub:'Step 1', ph:'Your answer here' },
        { id:'Y9_Q28a_plan_repeat_different_blocks_masses', sub:'Step 2', ph:'Your answer here' },
        { id:'Y9_Q28b_measurements', letter:'b', prompt:`What measurements does he need to take?`, ph:'Type your answer here' },
        { id:'Y9_Q28c_repeat_reason', letter:'c', prompt:`Azim repeats all of his measurements. Why does he do this?`, ph:'Type your answer here' },
        { id:'Y9_Q28d_results_table', letter:'d', prompt:`Draw a results table for Azim&rsquo;s investigation. Describe the column headings (and units) you would use.`, rows:4, ph:'Describe your results table — column headings and units' }
      ]
    },
    {
      bank: 'Y9_Q30', subject: 'Chemistry', part: 'D',
      topic: 'Acid neutralisation',
      stem: `<div class="spc-context">&ldquo;Acids in the stomach can cause indigestion. Indigestion tablets can get rid of the acid.&rdquo;</div>`,
      figs: [],
      parts: [
        { id:'Y9_Q30a_all_three_blanks', letter:'a',
          prompt:`Complete the sentences. Choose from the word bank.<br><span class="spc-wordbank">Word bank: absorb &middot; acidic &middot; alkaline &middot; neutralise &middot; salt &middot; sugar</span><br>Indigestion tablets ____ the acid in the stomach because indigestion tablets are ____. Indigestion tablets react with the acid to form water and a ____.`,
          rows:3, ph:'Write the three completed sentences' },
        { id:'Y9_Q30b_i_indicator_compare', letter:'b',
          lead:`<p class="spc-stem">Tom investigates two different indigestion tablets. He adds 3 drops of Universal Indicator solution to 50 cm³ of acid. Tom adds one indigestion tablet and stirs. He repeats this for the other indigestion tablet.</p>`,
          prompt:`What does Tom use to compare the tablets?`, ph:'Type your answer here' },
        { id:'Y9_Q30b_i_least_acidic_neutral', sub:'What does he look for?', ph:'Type your answer here' },
        { id:'Y9_Q30b_i_greatest_neutralisation', sub:'What does the best tablet show?', ph:'Type your answer here' },
        { id:'Y9_Q30b_ii_control_variable', letter:'c', prompt:`Write down one variable Tom should keep the same.`, ph:'Type your answer here' }
      ]
    },
    {
      bank: 'Y9_Q31', subject: 'Biology', part: 'D',
      topic: 'Respiratory system / alveoli',
      stem: `<p class="spc-stem">Alveoli are air sacs found at the end of the bronchioles in the lungs. Gas exchange happens in the alveoli.</p>`,
      figs: [],
      parts: [
        { id:'Y9_Q31a_diffusion', letter:'a', prompt:`Name the process by which oxygen moves from the air in the alveoli into the blood.`, ph:'Type your answer here' },
        { id:'Y9_Q31b_alveoli_function', letter:'b', prompt:`Write down one function of the alveoli.`, ph:'Type your answer here' },
        { id:'Y9_Q31c_adaptation', letter:'c', prompt:`Describe one adaptation of the alveoli and explain how this adaptation helps gas exchange.`, sub:'Adaptation', ph:'Type the adaptation' },
        { id:'Y9_Q31c_explanation', sub:'How it helps', ph:'Type how it helps gas exchange' },
        { id:'Y9_Q31d_iron', letter:'d', prompt:`Red blood cells transport oxygen around the body. Which mineral in the diet is needed to make red blood cells?`, ph:'Type your answer here' }
      ]
    }
  ]
};
