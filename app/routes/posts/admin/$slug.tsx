import { marked } from "marked";

import type { LoaderFunction } from "@remix-run/node";
import type { ActionFunction } from "@remix-run/node";
import { json, redirect } from "@remix-run/node";
import {
  useLoaderData,
  Form,
  useActionData,
  useTransition,
} from "@remix-run/react";
import invariant from "tiny-invariant";

import type { Post } from "~/models/post.server";
import { updatePost } from "~/models/post.server";
import { getPost } from "~/models/post.server";

type LoaderData = { post: Post; html: string };

export const loader: LoaderFunction = async ({ params }) => {
  invariant(params.slug, `params.slug is required`);

  const post = await getPost(params.slug);
  invariant(post, `Post not found: ${params.slug}`);

  const html = marked(post.markdown);
  return json<LoaderData>({ post, html });
};

type ActionData =
  | {
      title: null | string;
      markdown: null | string;
    }
  | undefined;

export const action: ActionFunction = async ({ request, params }) => {
  // TODO: remove me
  await new Promise((res) => setTimeout(res, 1000));

  const formData = await request.formData();

  const title = formData.get("title");
  const slug = formData.get("slug");
  const markdown = formData.get("markdown");

  const errors: ActionData = {
    title: title ? null : "Title is required",
    markdown: markdown ? null : "Markdown is required",
  };
  const hasErrors = Object.values(errors).some((errorMessage) => errorMessage);
  if (hasErrors) {
    return json<ActionData>(errors);
  }

  invariant(typeof title === "string", "title must be a string");
  invariant(typeof markdown === "string", "markdown must be a string");

  console.log(slug);

  invariant(params.slug, `params.slug is required`);
  await updatePost({ title, slug: params.slug, markdown });

  return redirect("/posts/admin");
};

const inputClassName = `w-full rounded border border-gray-500 px-2 py-1 text-lg`;

export default function PostSlug() {
  const { post, html } = useLoaderData<LoaderData>();
  const errors = useActionData();

  const transition = useTransition();
  const isUpdating = Boolean(transition.submission);

  return (
    <main className="mx-auto max-w-4xl">
      <h1 className="my-6 border-b-2 text-center text-3xl">{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: html }} />

      <Form method="put">
        <p>
          <label>
            Post Title:{" "}
            {errors?.title ? (
              <em className="text-red-600">{errors.title}</em>
            ) : null}
            <input
              type="text"
              defaultValue={post?.title}
              name="title"
              className={inputClassName}
            />
          </label>
        </p>
        <p>
          <label htmlFor="markdown">
            Markdown:{" "}
            {errors?.markdown ? (
              <em className="text-red-600">{errors.markdown}</em>
            ) : null}
          </label>
          <br />
          <textarea
            id="markdown"
            rows={20}
            defaultValue={post?.markdown}
            name="markdown"
            className={`${inputClassName} font-mono`}
          />
        </p>
        <p className="text-right">
          <button
            type="submit"
            className="rounded bg-blue-500 py-2 px-4 text-white hover:bg-blue-600 focus:bg-blue-400 disabled:bg-blue-300"
            disabled={isUpdating}
          >
            {isUpdating ? "Updating..." : "Update Post"}
          </button>
        </p>
      </Form>
    </main>
  );
}
