def dataset_exists_q(client, dataset_name):
    """Returns True if dataset with name=dataset_name exists."""
    bool = client.has_dataset(dataset_name=dataset_name)
    return bool


def create_dataset_overwrite(client, dataset_name, description):
    """Creates a new dataset, overwriting an existing one if it has the same name.

    so caution required!
    """
    print([client, dataset_name, description])
    c = client
    if c.has_dataset(dataset_name=dataset_name):
        print(f"dataset: {dataset_name} already exists")
        c.delete_dataset(dataset_name=dataset_name)
        print("hence we shall delete it and create a new one")
        c.create_dataset(dataset_name=dataset_name, description=description)
        print("dataset created:")
        dataset = c.read_dataset(dataset_name=dataset_name)
        return dataset
    else:
        c.create_dataset(dataset_name=dataset_name, description=description)
        print(f'dataset: "{dataset_name}" does not exist')
        print("dataset created")
        dataset = c.read_dataset(dataset_name=dataset_name)
        return dataset
