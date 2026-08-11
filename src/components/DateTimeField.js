// Native <input type="datetime-local"> renders as one combined field whose
// displayed format (mm/dd/yyyy, --:-- pm) is fixed by the browser's locale
// and can't be changed or clarified — confusing for anyone not expecting
// US month-first ordering. Splitting into a dedicated <input type="date">
// (calendar picker, unambiguous) and <input type="time"> (12h dial with
// explicit AM/PM) gives the same precision with a clearer, more discoverable
// UI. The two are recombined into the same "YYYY-MM-DDTHH:mm" naive string
// the rest of the app already expects (see src/lib/filterParams.js).
function splitValue(value) {
  if (!value) return { date: '', time: '' };
  const [date, time] = value.split('T');
  return { date: date || '', time: time || '' };
}

export default function DateTimeField({ value, onChange, label }) {
  const { date, time } = splitValue(value);

  function update(nextDate, nextTime) {
    if (!nextDate) {
      onChange('');
      return;
    }
    onChange(`${nextDate}T${nextTime || '00:00'}`);
  }

  return (
    <label className="datetime-field">
      {label && <span className="datetime-field-label">{label}</span>}
      <span className="datetime-field-inputs">
        <input
          type="date"
          value={date}
          onChange={(e) => update(e.target.value, time)}
        />
        <input
          type="time"
          value={time}
          disabled={!date}
          onChange={(e) => update(date, e.target.value)}
        />
      </span>
    </label>
  );
}
