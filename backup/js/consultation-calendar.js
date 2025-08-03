document.addEventListener('DOMContentLoaded', function() {
    initCalendar();
});

function initCalendar() {
    const calendar = document.getElementById('consultationCalendar');
    const today = new Date();
    let currentMonth = today.getMonth();
    let currentYear = today.getFullYear();

    renderCalendar(currentMonth, currentYear);

    // Add navigation buttons
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
        <button class="btn btn-default" id="prevMonth">&lt;</button>
        <h4 id="monthDisplay"></h4>
        <button class="btn btn-default" id="nextMonth">&gt;</button>
    `;
    calendar.insertBefore(header, calendar.firstChild);

    // Add event listeners for navigation
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar(currentMonth, currentYear);
    });

    document.getElementById('nextMonth').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar(currentMonth, currentYear);
    });
}

function renderCalendar(month, year) {
    const calendar = document.getElementById('consultationCalendar');
    const monthDisplay = document.getElementById('monthDisplay');
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const today = new Date();

    // Update month display
    monthDisplay.textContent = `${months[month]} ${year}`;

    // Clear existing calendar grid
    const existingGrid = calendar.querySelector('.calendar-grid');
    if (existingGrid) {
        existingGrid.remove();
    }

    // Create calendar grid
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    // Add day headers
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    days.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day header';
        dayHeader.textContent = day;
        grid.appendChild(dayHeader);
    });

    // Get first day of month and total days
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const startingDay = firstDay.getDay();

    // Add blank spaces for days before start of month
    for (let i = 0; i < startingDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'calendar-day disabled';
        grid.appendChild(blank);
    }

    // Add days of month
    for (let day = 1; day <= totalDays; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        dayElement.textContent = day;

        const date = new Date(year, month, day);
        
        // Disable past dates and weekends
        if (date < today || date.getDay() === 0 || date.getDay() === 6) {
            dayElement.classList.add('disabled');
        } else {
            dayElement.addEventListener('click', () => selectDate(dayElement, date));
        }

        grid.appendChild(dayElement);
    }

    calendar.appendChild(grid);
}

function selectDate(element, date) {
    // Remove selection from all days
    document.querySelectorAll('.calendar-day').forEach(day => {
        day.classList.remove('selected');
    });

    // Add selection to clicked day
    element.classList.add('selected');

    // Format date for display
    const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Update hidden input or trigger callback
    const event = new CustomEvent('dateSelected', {
        detail: {
            date: date,
            formatted: formattedDate
        }
    });
    document.dispatchEvent(event);
} 