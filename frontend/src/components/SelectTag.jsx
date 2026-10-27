import { useState } from "react";

function SelectTag({roles}) {
    const [role, setRole] = useState("");

    const handleChange = (e) => {
         setRole(e.target.value);
    };

    // const roles = [
    //     { id: "architect", name: "Architect" },
    //     { id: "ba", name: "BA" },
    //     { id: "pm", name: "PM" },
    //     { id: "teamlead", name: "Team Lead" },
    //     { id: "testlead", name: "Test Lead" },
    //     { id: "srengineer", name: "Sr. Engineer" },
    //     { id: "engineer", name: "Engineer" }
    // ]

    return (
        <select value={role} onChange={handleChange}>
            <option value="">Select Role</option>

            {roles.map((item) => (
                <option key={item.id} value={item.id}>
                    {item.name}
                </option>
            ))}
        </select>
    );
}

export default SelectTag;