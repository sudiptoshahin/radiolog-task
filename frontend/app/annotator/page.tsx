"use client";

import { IAnnotatorPayload } from "@/models/annotators";
import useAnnotatorStore from "@/store/useAnnotatorStore";
import { useEffect } from "react";

import { FileImage, Loader2 } from "lucide-react";


export default function Annotator() {

    const { cases, fetchAnnotatorCases, isLoading } = useAnnotatorStore();

    useEffect(() => {
        fetchAnnotatorCases();
    }, []);



    return (
        <div className="mx-auto w-full max-w-3xl p-6">
            <h1 className="text-2xl font-bold text-neutral-800">Annotate Image</h1>
            <p className="mt-1 text-sm text-neutral-500">
                Select a case below to start annotating.
            </p>

            <div className="mt-6">
                {isLoading && cases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
                        <p className="text-sm text-neutral-400">Loading cases...</p>
                    </div>
                ) : cases.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
                            <FileImage className="h-7 w-7 text-neutral-400" />
                        </div>
                        <div>
                            <p className="text-base font-semibold text-neutral-700">
                                No cases found
                            </p>
                            <p className="mt-1 text-sm text-neutral-400">
                                New cases will show up here once they're available.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {cases.map((case_) => (
                            <div
                                key={case_.id}
                                className="cursor-pointer rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition hover:border-indigo-300 hover:shadow-md"
                            >
                                <p className="text-sm font-medium text-neutral-800">
                                    {case_.title}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}