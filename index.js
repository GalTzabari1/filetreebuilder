// External libraries
import express from "express";
import axios from "axios";

// Constants
import { FILE_TYPES } from "./fileTypes.js";

const app = express();
const PORT = 5001;

const getRecursiveTree = async (owner, repo, tree_sha) => {
	const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${tree_sha}`;
	const { data } = await axios.get(url, { query: { recursive: false } });

	const tree = await Promise.all(
		data.tree.map(async (file) => {
			if (file.type === FILE_TYPES.Blob) {
				return file;
			}

			return {
				...file,
				children: await getRecursiveTree(owner, repo, file.sha),
			};
		})
	);
	return tree;
};

app.get("/treeStructure", async (req, res) => {
	const { owner, repoName } = req.query;
	try {
		if (!owner || !repoName) {
			throw {
				status: 400,
				message: "owner and repoName are required",
			};
		}
		const url = `https://api.github.com/repos/${owner}/${repoName}/commits`;

		const response = await axios.get(url);
		const LAST_COMMIT = 0;
		const { sha } = response.data[LAST_COMMIT];
		const tree = await getRecursiveTree(owner, repoName, sha);
		res.send(tree);
	} catch (error) {
		const status = error?.status || 500;
		res.status(status).send(error.message);
	}
});

app.listen(PORT, () => {
	console.log("Server is running is port: " + PORT);
});
