import argparse
from model.prompt import Prompt
from storage.file import FileStorage
from storage.inmemory import InMemoryStorage
from storage.git import GitStorage

def main():
    parser = argparse.ArgumentParser(description="PromptPilot CLI")
    parser.add_argument("--storage", choices=["file", "inmemory", "git"], default="file", help="Storage backend")
    subparsers = parser.add_subparsers(dest="command")

    # Create prompt
    create_parser = subparsers.add_parser("create", help="Create a new prompt")
    create_parser.add_argument("--id", required=True)
    create_parser.add_argument("--name", required=True)
    create_parser.add_argument("--description", required=True)
    create_parser.add_argument("--task_type", required=True)
    create_parser.add_argument("--tags", nargs="*", default=[])
    create_parser.add_argument("--model_provider", required=True)
    create_parser.add_argument("--model_name", required=True)

    # List prompts
    subparsers.add_parser("list", help="List all prompts")

    # Delete prompt
    delete_parser = subparsers.add_parser("delete", help="Delete a prompt")
    delete_parser.add_argument("--id", required=True)

    args = parser.parse_args()

    # Select storage backend
    if args.storage == "file":
        storage = FileStorage()
    elif args.storage == "inmemory":
        storage = InMemoryStorage()
    elif args.storage == "git":
        storage = GitStorage()
    else:
        raise ValueError("Invalid storage backend")

    if args.command == "create":
        prompt = Prompt(
            id=args.id,
            name=args.name,
            description=args.description,
            task_type=args.task_type,
            tags=args.tags,
            developer_notes=None,
            version_info=None,
            messages=[],
            input_variables={},
            final_prompt_structure=None,
            model_provider=args.model_provider,
            model_name=args.model_name,
            parameters={},
        )
        storage.save_prompt(prompt)
        print(f"Prompt '{args.id}' created.")

    elif args.command == "list":
        prompts = storage.list_prompts()
        print("Prompts:")
        for pid in prompts:
            print(f"- {pid}")

    elif args.command == "delete":
        storage.delete_prompt(args.id)
        print(f"Prompt '{args.id}' deleted.")

    else:
        parser.print_help()

if __name__ == "__main__":
    main()
