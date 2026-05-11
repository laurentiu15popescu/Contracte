const EditableField = ({
  value,
  onChange,
  editMode,
  placeholder = "..............................",
}) => {
  const display = value || placeholder;
  if (!editMode || !onChange) {
    return <strong>{display}</strong>;
  }
  return (
    <strong
      contentEditable
      suppressContentEditableWarning
      onBlur={(e) => {
        const v = e.currentTarget.textContent.trim();
        if (v !== value && v !== placeholder) onChange(v);
      }}
      style={{
        background: "#fff7d6",
        outline: "1px dashed #d4a72c",
        padding: "0 4px",
        cursor: "text",
        minWidth: 30,
        display: "inline-block",
      }}
    >
      {display}
    </strong>
  );
};

export default EditableField;
