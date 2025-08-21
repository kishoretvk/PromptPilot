from typing import Dict, Any, Optional

class VariableDefinition:
    def __init__(
        self,
        name: str,
        var_type: str,
        description: str,
        required: bool = True,
        max_length: Optional[int] = None,
        min_length: Optional[int] = None,
        choices: Optional[list] = None,
        default: Optional[Any] = None,
    ):
        self.name = name
        self.var_type = var_type  # string, int, float, bool, etc.
        self.description = description
        self.required = required
        self.max_length = max_length
        self.min_length = min_length
        self.choices = choices
        self.default = default

    def validate(self, value: Any) -> bool:
        if self.required and value is None:
            return False
        if self.var_type == "string":
            if not isinstance(value, str):
                return False
            if self.max_length and len(value) > self.max_length:
                return False
            if self.min_length and len(value) < self.min_length:
                return False
        if self.var_type == "int":
            if not isinstance(value, int):
                return False
        if self.choices and value not in self.choices:
            return False
        return True

def validate_variables(schema: Dict[str, VariableDefinition], values: Dict[str, Any]) -> bool:
    for name, definition in schema.items():
        value = values.get(name, definition.default)
        if not definition.validate(value):
            return False
    return True
