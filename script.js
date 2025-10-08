let selectedBudget = "";

    document.querySelectorAll('.budget').forEach(el => {
      el.addEventListener('click', () => {
        document.querySelectorAll('.budget').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        selectedBudget = el.dataset.budget;
      });
    });

    async function askAI() {
      const destination = document.getElementById('destination').value;
      const days = document.getElementById('days').value;
      const responseBox = document.getElementById('response');

      if (!destination || !days || !selectedBudget) {
        responseBox.innerHTML = "<p>Please fill in all fields and select a budget.</p>";
        return;
      }

      const hotelClass = {
        cheap: "budget hotel or hostel",
        moderate: "3-star hotel",
        luxury: "5-star hotel or resort"
      };

      const prompt = `You are a professional travel planner. 
Plan a detailed ${days}-day itinerary for a trip to ${destination}, India on a ${selectedBudget} budget.

Output must be in clean and structured HTML using <h2>, <h3>, <ul>, <li>, <p> etc. Do not use Markdown formatting like *, #, **, etc.

Include:
- A clear daily plan: places to visit (with entry fees), restaurants to eat at, commute suggestions.
- A hotel recommendation with name and cost per night for a ${hotelClass[selectedBudget]}.
- Useful travel tips at the end.
- Structure it beautifully with headers, lists, and spacing.
`;

      responseBox.innerHTML = 'Generating itinerary...';

      try {
        const res = await fetch('http://localhost:11434/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'gemma:2b',
            messages: [
              { role: 'system', content: 'You are a helpful travel planner AI.' },
              { role: 'user', content: prompt }
            ],
            stream: false
          })
        });

        const data = await res.json();
        let content = data.choices[0].message.content;

        if (!content.includes('<h2') && !content.includes('<p')) {
          content = marked.parse(content); // fallback if AI returns Markdown
        }

        responseBox.innerHTML = content;
      } catch (err) {
        responseBox.innerHTML = '<p>Error fetching response. Make sure Ollama is running.</p>';
      }
    }

    async function downloadPDF() {
      const { jsPDF } = window.jspdf;
      const responseEl = document.getElementById('response');
      const canvas = await html2canvas(responseEl);
      const imgData = canvas.toDataURL('image/png');

      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const imgWidth = pageWidth - 20;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
      pdf.save("itinerary.pdf");
    }