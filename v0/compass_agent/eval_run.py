import os
from dotenv import load_dotenv
from agent import (
    initialize_agent,
    _get_trajectory,
)
from langsmith import Client, evaluate
from evals.eval_helper_functions import create_dataset_overwrite
from sys import stdout
from uuid import uuid4
from pathlib import Path
import yaml
from datetime import date
from agent import SUPPORTED_MODELS_TYPE
from langsmith.schemas import Example, Run
from typing import Optional, Union
import argparse
from langsmith.evaluation.evaluator import (
    RunEvaluator,
    EvaluationResults,
    EvaluationResult,
)

from uuid import UUID

load_dotenv()
OPENAI_API_KEY = os.environ["OPENAI_API_KEY"]
LANGSMITH_TRACING = os.environ["LANGSMITH_TRACING"]
LANGSMITH_ENDPOINT = os.environ["LANGSMITH_ENDPOINT"]
LANGSMITH_API_KEY = os.environ["LANGSMITH_API_KEY"]
LANGSMITH_PROJECT = os.environ["LANGSMITH_PROJECT"]


def _find_files(root_dir: str, filename: str) -> list[str]:
    """Search for files with a given filename within a specified directory and its
    subdirectories.

    Args:
        root_dir: The root directory to begin the search.
        filename: The name of the file to search for.

    Returns:
        A list of file paths that match the given filename.
    """
    # Use rglob to recursively find all files matching the filename
    return [str(file) for file in Path(root_dir).rglob(filename)]


def _file(filename: str) -> list[str]:
    """Returns a list containing the specified yaml file."""
    return _find_files(root_dir="evals/dataset", filename=filename)


def create_or_replace_dataset(yaml_file: Path) -> UUID:
    """Given a YAML file of examples, create a LangSmith dataset and add the examples to
    it. If the dataset already exists, it will be overwritten.

    Args:
        yaml_file: The path to the YAML file containing the examples.

    Returns:
        The ID of the created dataset.
    """

    # Load the YAML file
    with open(yaml_file, "r") as f:
        yamls_contents_list = yaml.safe_load(f)["tests"]

    # Create the inputs for the LangSmith dataset
    inputs = [{"question": example["question"]} for example in yamls_contents_list]

    # Create the outputs for the LangSmith dataset
    outputs = [
        {"answer": example["answer"], "trajectory": example["trajectory"]}
        for example in yamls_contents_list
    ]

    # Initialize the LangSmith client
    client = Client()

    # Create a unique name for the dataset based on the YAML file and the current date
    DATASET_NAME = f"Eval:{yaml_file}:{date.today().isoformat()}"

    # Create or overwrite the dataset
    dataset = create_dataset_overwrite(
        client=client,
        dataset_name=DATASET_NAME,
        description="Dataset for evaluating Compass API agent responses.",
    )

    # Get the ID of the created dataset
    DATASET_ID = dataset.id

    # Add the examples to the dataset
    client.create_examples(inputs=inputs, outputs=outputs, dataset_id=DATASET_ID)

    # Return the ID of the dataset
    return DATASET_ID


class TrajectoryRunEvaluator(RunEvaluator):
    """Evaluator interface class."""

    """
    Evaluate a run of a model on a dataset.

    Args:
        run: The run to evaluate.
        example: The example to evaluate against.

    Returns:
        An EvaluationResult object containing the evaluation score and comment.
    """

    def evaluate_run(
        self, run: Run, example: Optional[Example] = None
    ) -> Union[EvaluationResult, EvaluationResults]:
        if not example or not example.outputs or not run.outputs:
            return EvaluationResult(key="empty valution")

        # If the lengths of the trajectories are different, score is 0 and comment is set.
        if len(example.outputs["trajectory"]) != len(run.outputs["trajectory"]):
            score: float = 0.0
            comment: str = "Length of trajectories differ."
        else:
            # Calculate the score based on the number of matching elements in the trajectories.
            score: float = sum(
                [
                    a == b
                    for a, b in zip(
                        run.outputs["trajectory"],  # pyright: ignore
                        example.outputs["trajectory"],  # pyright: ignore
                    )
                ]
            ) / len(run.outputs["trajectory"])  # pyright: ignore
            comment: str = ""

        # Return an EvaluationResult object.
        return EvaluationResult(
            key="trajectory_score", score=score, value=None, comment=comment
        )


def generate_target_function1(model: SUPPORTED_MODELS_TYPE):
    """Generate a target function using the specified model.

    Args:
        model: The model to use for the agent. Should be one of the SUPPORTED_MODELS_TYPE.

    Returns:
        A function that takes a dictionary of inputs and returns a dictionary
        containing the answer and trajectory.
    """
    # Initialize the agent with the given model
    agent = initialize_agent(model=model)

    def target(inputs: dict) -> dict:
        """Process inputs to generate a response and trajectory.

        Args:
            inputs: A dictionary with a 'question' key containing the query.

        Returns:
            A dictionary with 'answer' and 'trajectory' keys.
        """
        query = inputs["question"]  # Extract the question from the inputs
        response, trajectory = _get_trajectory(
            agent_executor=agent, user_input=query, thread_id=str(uuid4())
        )
        return {"answer": response, "trajectory": trajectory}

    return target


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--yaml_file",
        required=True,
        type=str,
        help="The name of the yaml-file to process.",
    )
    parser.add_argument(
        "--threshold",
        # required=True,
        default=0.9,
        type=float,
        help="The percentage of tests that must pass to pass the evaluation.",
    )
    parser.add_argument(
        "--model",
        required=True,
        type=str,
        help="The name of the model to test.",
        choices=["gpt-4o-mini", "gpt-4o-2024-11-20", "gpt-4o"],
    )

    args = parser.parse_args()

    assert args.threshold >= 0 and args.threshold <= 1, (
        f"threshold must be between 0 and 1. Got {args.threshold}"
    )

    DATASET_ID = create_or_replace_dataset(yaml_file=args.yaml_file)

    trajectory_evaluator = TrajectoryRunEvaluator()

    trajectory_eval = evaluate(
        generate_target_function1(model=args.model),
        data=DATASET_ID,
        evaluators=[trajectory_evaluator],
        experiment_prefix="Compass API Agent Evaluation",
        num_repetitions=1,
        description="Evaluating the Compass API agent's performance on predefined queries.",
        max_concurrency=10,
    )

    # trajectory_eval._results[0]["evaluation_results"]["results"]
    df = trajectory_eval.to_pandas()

    total_score: float = float(df["feedback.trajectory_score"].mean())
    df_failed = df[df["feedback.trajectory_score"] != 1.0]

    for irow, row in df_failed.iterrows():
        question = row["inputs.question"]

        print(f"""
----------------------
-> trajectories don't match!
question:          {question}
answer:            {row["outputs.answer"]}
reference-answer:  {row["reference.answer"]}
trajectory:           {row["outputs.trajectory"]}
reference.trajectory: {row["reference.trajectory"]}
----------------------""")
    stdout.flush()
    if total_score < args.threshold:
        raise ValueError(
            f"""less than {args.threshold * 100}% of the trajectory tests passed: grade = {total_score * 100}%"""
        )
    else:
        print(
            f"""more than {args.threshold * 100}% of the trajectory tests passed: grade = {total_score * 100}%"""
        )
