const PersistentPriorityQueue =
    require("./module");


async function main() {
    const queue =
        new PersistentPriorityQueue({
            filePath: "./data/test-queue.json"
        });


    console.log(
        "Initially empty:",
        queue.is_empty()
    );


    console.log("\n--- INSERT ---");


    const taskA =
        queue.insert(
            "Send email",
            30
        );

    const taskB =
        queue.insert(
            "Process payment",
            10
        );

    const taskC =
        queue.insert(
            "Generate report",
            20
        );

    const taskD =
        queue.insert(
            "Backup database",
            40
        );


    console.log(taskA);
    console.log(taskB);
    console.log(taskC);
    console.log(taskD);


    console.log("\n--- PEEK ---");

    console.log(
        queue.peek()
    );


    console.log("\n--- EXTRACT MIN ---");

    console.log(
        queue.extract_min()
    );


    console.log("\n--- EXTRACT MAX ---");

    console.log(
        queue.extract_max()
    );


    console.log("\n--- UPDATE ---");

    console.log(
        "Before:",
        queue.peek()
    );


    queue.update(
        taskC.id,
        5
    );


    console.log(
        "After:",
        queue.peek()
    );


    console.log("\n--- DELETE ---");

    console.log(
        queue.delete(
            taskA.id
        )
    );


    console.log("\n--- FINAL STATE ---");

    console.log(
        "Size:",
        queue.size()
    );

    console.log(
        "Empty:",
        queue.is_empty()
    );

    console.log(
        "Peek:",
        queue.peek()
    );


    console.log("\n--- EXTRACT REMAINING ---");

    while (!queue.is_empty()) {
        console.log(
            queue.extract_min()
        );
    }


    console.log(
        "\nEmpty:",
        queue.is_empty()
    );
}


main().catch(error => {
    console.error(
        "Error:",
        error.message
    );

    process.exit(1);
});