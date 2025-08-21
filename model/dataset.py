from typing import List, Dict, Any, Optional
import random

class Dataset:
    def __init__(self, name: str, description: str, data: Optional[List[Dict[str, Any]]] = None):
        self.name = name
        self.description = description
        self.data = data or []

    def add_example(self, example: Dict[str, Any]):
        self.data.append(example)

    def get_examples(self, n: Optional[int] = None) -> List[Dict[str, Any]]:
        if n is None or n >= len(self.data):
            return self.data
        return random.sample(self.data, n)

    def validate_examples(self, schema: Dict[str, Any]) -> bool:
        for example in self.data:
            for key, definition in schema.items():
                if key not in example:
                    return False
                value = example[key]
                # Basic type checking
                if definition.get("type") == "string" and not isinstance(value, str):
                    return False
                if definition.get("type") == "int" and not isinstance(value, int):
                    return False
                # Add more type checks as needed
        return True

    def generate_synthetic(self, schema: Dict[str, Any], count: int = 10):
        import faker
        fake = faker.Faker()
        for _ in range(count):
            example = {}
            for key, definition in schema.items():
                t = definition.get("type")
                if t == "string":
                    example[key] = fake.text(max_nb_chars=definition.get("max_length", 20))
                elif t == "int":
                    example[key] = random.randint(0, 100)
                elif t == "float":
                    example[key] = random.uniform(0, 100)
                elif t == "bool":
                    example[key] = random.choice([True, False])
                else:
                    example[key] = None
            self.add_example(example)
