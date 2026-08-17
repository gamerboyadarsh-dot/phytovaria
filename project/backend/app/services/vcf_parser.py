"""
Minimal, dependency-free VCF parser.

We deliberately avoid cyvcf2/pysam here: those require compiled C
extensions (htslib) that are painful to install on random Windows
laptops mid-hackathon. Standard VCF is plain text, so a small parser
covering the columns we actually need is more reliable for a 6-day
deadline. It handles standard VCFv4.x single-sample files, which is
what the SolGenomics tomato accession VCFs provide.
"""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class ParsedVariant:
    chromosome: str
    position: int
    ref_allele: str
    alt_allele: str
    genotype: Optional[str] = None


def parse_vcf_text(vcf_text: str, max_variants: int = 5000) -> List[ParsedVariant]:
    """
    Parses VCF file content (already read as text, gzip decompression
    should happen before calling this if needed).

    Returns a list of ParsedVariant. Caps at max_variants so a huge
    genome-wide VCF doesn't stall the demo -- fine for a prototype,
    should be paginated/streamed in production.
    """
    variants: List[ParsedVariant] = []

    for line in vcf_text.splitlines():
        if not line or line.startswith("#"):
            continue
        if len(variants) >= max_variants:
            break

        fields = line.split("\t")
        if len(fields) < 5:
            continue

        chrom, pos, _id, ref, alt = fields[0], fields[1], fields[2], fields[3], fields[4]

        # ALT can be comma-separated for multi-allelic sites; take the first
        # for the prototype and note it's simplified.
        alt_first = alt.split(",")[0]

        genotype = None
        if len(fields) >= 10:
            # FORMAT is fields[8], sample genotype fields[9]
            fmt_keys = fields[8].split(":")
            sample_vals = fields[9].split(":")
            if "GT" in fmt_keys:
                genotype = sample_vals[fmt_keys.index("GT")]

        try:
            position_int = int(pos)
        except ValueError:
            continue

        variants.append(
            ParsedVariant(
                chromosome=chrom,
                position=position_int,
                ref_allele=ref,
                alt_allele=alt_first,
                genotype=genotype,
            )
        )

    return variants
