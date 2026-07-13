"use client";

import { IAnatomyCaseType, IAnatomyTypeCase, IAnnotatorPayload } from "@/models/annotators";
import useAnnotatorStore from "@/store/useAnnotatorStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileImage, Loader2 } from "lucide-react";


export default function Annotator() {
    const router = useRouter();
    const { isLoading, fetchAnatomyCaseTypes, typesCases, getCase } = useAnnotatorStore();

    useEffect(() => {
        fetchAnatomyCaseTypes();
    }, []);


    async function handleRedirectToAnnotate(slug: string) {
        router.push(`/annotator/${slug}/annotate/`);
    }

    return (
        <div className="mx-auto w-full max-w-3xl p-6">
            <h1 className="text-2xl font-bold text-neutral-800">Annotate Image</h1>
            <p className="mt-1 text-sm text-neutral-500">
                Select a case below to start annotating.
            </p>

            <div className="mt-6">
                {isLoading && typesCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                        <p className="text-sm text-neutral-400">Loading cases types...</p>
                    </div>
                ) : typesCases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                            <FileImage className="h-7 w-7 text-neutral-400" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-neutral-700">
                                No case types found
                            </p>
                            <p className="mt-1 text-sm text-neutral-400">
                                New cases will show up here once they're available.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {typesCases.map((type: IAnatomyCaseType) => (
                            <div
                                key={type.id}
                                className="rounded-xl border border-green-100 bg-green-50/60 p-5 shadow-sm transition-shadow hover:shadow-md hover:border-green-200"
                            >
                                <div className="mb-3 flex items-center justify-between">
                                    <h2 className="text-base font-semibold text-green-900">
                                        {type.title}
                                    </h2>
                                    <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                                        {type.cases.length} {type.cases.length === 1 ? "case" : "cases"}
                                    </span>
                                </div>

                                {type.cases.length > 0 ? (
                                    <ul className="flex flex-col gap-2">
                                        {type.cases.map((case_: IAnatomyTypeCase) => (
                                            <li
                                                key={case_.id}
                                                className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-gray-700 ring-1 ring-green-100 transition-colors hover:bg-green-50 hover:ring-green-200 cursor-pointer"
                                                onClick={() => handleRedirectToAnnotate(case_.slug)}>
                                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-500" />
                                                {case_.title} - ({case_.image_count})
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p className="flex items-center gap-2 rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-700 ring-1 ring-yellow-200">
                                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-yellow-400" />
                                        No cases yet
                                    </p>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}