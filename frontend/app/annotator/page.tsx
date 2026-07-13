"use client";

import { IAnatomyCaseType, IAnatomyTypeCase, IAnnotatorPayload } from "@/models/annotators";
import useAnnotatorStore from "@/store/useAnnotatorStore";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileImage, Loader2, ImageIcon } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";


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
        <AppLayout>
            <div className="mx-auto w-full max-w-3xl p-6">
                <h1 className="text-2xl font-bold text-sage-dark">Annotate Image</h1>
                <p className="mt-1 text-sm text-taupe-dark/60">
                    Select a case below to start annotating.
                </p>

                <div className="mt-6">
                    {isLoading && typesCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <Loader2 className="h-6 w-6 animate-spin text-sage" />
                            <p className="text-sm text-taupe-dark/60">Loading case types...</p>
                        </div>
                    ) : typesCases.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-cream">
                                <FileImage className="h-7 w-7 text-sage-dark" />
                            </div>
                            <div>
                                <p className="text-base font-semibold text-sage-dark">
                                    No case types found
                                </p>
                                <p className="mt-1 text-sm text-taupe-dark/60">
                                    New cases will show up here once they're available.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            {typesCases.map((type: IAnatomyCaseType) => (
                                <div
                                    key={type.id}
                                    className="rounded-xl border border-sage/20 bg-cream/40 p-5 shadow-sm transition-shadow hover:shadow-md hover:border-sage/40"
                                >
                                    <div className="mb-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sage/15">
                                                <ImageIcon className="h-4 w-4 text-sage-dark" />
                                            </div>
                                            <h2 className="text-base font-semibold text-sage-dark">
                                                {type.title}
                                            </h2>
                                        </div>
                                        <span className="rounded-full bg-sage/15 px-2.5 py-0.5 text-xs font-medium text-sage-dark">
                                            {type.cases.length} {type.cases.length === 1 ? "case" : "cases"}
                                        </span>
                                    </div>

                                    {type.cases.length > 0 ? (
                                        <ul className="flex flex-col gap-2">
                                            {type.cases.map((case_: IAnatomyTypeCase) => (
                                                <li
                                                    key={case_.id}
                                                    className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm text-neutral-700 ring-1 ring-sage/15 transition-colors hover:bg-sage/10 hover:ring-sage/30 cursor-pointer"
                                                    onClick={() => handleRedirectToAnnotate(case_.slug)}>
                                                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-sage" />
                                                    {case_.title} - ({case_.image_count})
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="flex items-center gap-2 rounded-lg bg-taupe/10 px-3 py-2 text-sm text-taupe-dark ring-1 ring-taupe/25">
                                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-taupe" />
                                            No cases yet
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    )
}