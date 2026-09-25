from io import BytesIO

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import (
    getSampleStyleSheet,
    ParagraphStyle,
)
from reportlab.lib.units import mm
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    HRFlowable,
)


def clean_text(value):
    """
    Convert empty/null values into safe strings.
    """

    if value is None:
        return ""

    return str(value).strip()


def add_section_title(
    story,
    title,
    styles
):
    """
    Add a professional resume section heading.
    """

    story.append(
        Spacer(
            1,
            5 * mm
        )
    )

    story.append(
        Paragraph(
            title.upper(),
            styles["HireLensSectionTitle"]
        )
    )

    story.append(
        HRFlowable(
            width="100%",
            thickness=0.8,
            color=colors.HexColor("#334155"),
            spaceBefore=1,
            spaceAfter=3 * mm
        )
    )


def add_bullet_list(
    story,
    items,
    styles
):
    """
    Add bullet points to the resume.
    """

    if not items:
        return

    for item in items:

        item = clean_text(item)

        if not item:
            continue

        story.append(
            Paragraph(
                f"• {item}",
                styles["HireLensBullet"]
            )
        )

        story.append(
            Spacer(
                1,
                1.5 * mm
            )
        )


def normalize_experience(
    experience
):
    """
    Convert different experience formats into
    a consistent list of dictionaries.
    """

    if not experience:
        return []

    if isinstance(
        experience,
        str
    ):
        return [
            {
                "title": "",
                "company": "",
                "duration": "",
                "bullets": [
                    experience
                ]
            }
        ]

    if not isinstance(
        experience,
        list
    ):
        return []

    normalized = []

    for item in experience:

        if isinstance(
            item,
            str
        ):

            normalized.append({
                "title": "",
                "company": "",
                "duration": "",
                "bullets": [
                    item
                ]
            })

            continue


        if not isinstance(
            item,
            dict
        ):
            continue


        title = clean_text(
            item.get("title")
        )

        company = clean_text(
            item.get("company")
        )

        duration = clean_text(
            item.get("duration")
        )

        bullets = item.get(
            "bullets",
            []
        )


        # ----------------------------------------------
        # Support AI-improved bullet format
        # ----------------------------------------------

        if not bullets:

            bullet = clean_text(
                item.get("bullet")
            )

            if bullet:
                bullets = [bullet]


        if isinstance(
            bullets,
            str
        ):

            bullets = [bullets]


        bullets = [
            clean_text(bullet)
            for bullet in bullets
            if clean_text(bullet)
        ]


        normalized.append({

            "title": title,

            "company": company,

            "duration": duration,

            "bullets": bullets

        })


    return normalized


def generate_resume_pdf(
    candidate,
    professional_summary,
    skills,
    experience,
    projects,
    education,
    certifications
):
    """
    Generate a professional ATS-friendly resume PDF.

    Returns:
        BytesIO object containing the generated PDF.
    """

    pdf_buffer = BytesIO()

    document = SimpleDocTemplate(

        pdf_buffer,

        pagesize=A4,

        rightMargin=17 * mm,

        leftMargin=17 * mm,

        topMargin=15 * mm,

        bottomMargin=15 * mm,

        title="HireLens Improved Resume",

        author="HireLens"
    )


    styles = getSampleStyleSheet()


    # --------------------------------------------------
    # Custom HireLens styles
    # --------------------------------------------------

    styles.add(
        ParagraphStyle(
            name="HireLensCandidateName",
            parent=styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=20,
            leading=24,
            alignment=TA_CENTER,
            textColor=colors.HexColor(
                "#0f172a"
            ),
            spaceAfter=2 * mm
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensContact",
            parent=styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            alignment=TA_CENTER,
            textColor=colors.HexColor(
                "#475569"
            ),
            spaceAfter=4 * mm
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensSectionTitle",
            parent=styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=10.5,
            leading=13,
            textColor=colors.HexColor(
                "#0f172a"
            ),
            spaceBefore=0,
            spaceAfter=0
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensBody",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9.2,
            leading=13,
            textColor=colors.HexColor(
                "#1e293b"
            ),
            spaceAfter=2 * mm
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensBullet",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=9,
            leading=12.5,
            leftIndent=4 * mm,
            firstLineIndent=-2.5 * mm,
            textColor=colors.HexColor(
                "#1e293b"
            ),
            spaceAfter=1 * mm
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensItemTitle",
            parent=styles["BodyText"],
            fontName="Helvetica-Bold",
            fontSize=9.5,
            leading=12,
            textColor=colors.HexColor(
                "#0f172a"
            ),
            spaceAfter=1 * mm
        )
    )


    styles.add(
        ParagraphStyle(
            name="HireLensSmallText",
            parent=styles["BodyText"],
            fontName="Helvetica",
            fontSize=8.5,
            leading=11,
            textColor=colors.HexColor(
                "#475569"
            ),
            spaceAfter=1.5 * mm
        )
    )


    story = []


    # --------------------------------------------------
    # Candidate header
    # --------------------------------------------------

    candidate_name = clean_text(
        candidate.get("full_name")
    )

    email = clean_text(
        candidate.get("email")
    )

    phone = clean_text(
        candidate.get("phone")
    )

    location = clean_text(
        candidate.get("location")
    )

    linkedin = clean_text(
        candidate.get("linkedin_url")
    )

    github = clean_text(
        candidate.get("github_url")
    )

    portfolio = clean_text(
        candidate.get("portfolio_url")
    )


    story.append(
        Paragraph(
            candidate_name or "Candidate",
            styles[
                "HireLensCandidateName"
            ]
        )
    )


    contact_items = [
        value
        for value in [
            email,
            phone,
            location
        ]
        if value
    ]


    if linkedin:
        contact_items.append(
            linkedin
        )


    if github:
        contact_items.append(
            github
        )


    if portfolio:
        contact_items.append(
            portfolio
        )


    if contact_items:

        story.append(
            Paragraph(
                " | ".join(
                    contact_items
                ),
                styles[
                    "HireLensContact"
                ]
            )
        )


    # --------------------------------------------------
    # Professional Summary
    # --------------------------------------------------

    if professional_summary:

        add_section_title(
            story,
            "Professional Summary",
            styles
        )

        story.append(
            Paragraph(
                clean_text(
                    professional_summary
                ),
                styles[
                    "HireLensBody"
                ]
            )
        )


    # --------------------------------------------------
    # Skills
    # --------------------------------------------------

    if skills:

        add_section_title(
            story,
            "Technical Skills",
            styles
        )

        if isinstance(
            skills,
            list
        ):

            skill_text = ", ".join(
                [
                    clean_text(skill)
                    for skill in skills
                    if clean_text(skill)
                ]
            )

        else:

            skill_text = clean_text(
                skills
            )


        if skill_text:

            story.append(
                Paragraph(
                    skill_text,
                    styles[
                        "HireLensBody"
                    ]
                )
            )


    # --------------------------------------------------
    # Experience
    # --------------------------------------------------

    normalized_experience = (
        normalize_experience(
            experience
        )
    )


    if normalized_experience:

        add_section_title(
            story,
            "Experience",
            styles
        )


        for item in normalized_experience:

            title = clean_text(
                item.get("title")
            )

            company = clean_text(
                item.get("company")
            )

            duration = clean_text(
                item.get("duration")
            )

            bullets = item.get(
                "bullets",
                []
            )


            heading_parts = [
                part
                for part in [
                    title,
                    company
                ]
                if part
            ]


            heading = " | ".join(
                heading_parts
            )


            if duration:

                heading = (
                    f"{heading} "
                    f"({duration})"
                )


            if heading:

                story.append(
                    Paragraph(
                        heading,
                        styles[
                            "HireLensItemTitle"
                        ]
                    )
                )


            add_bullet_list(
                story,
                bullets,
                styles
            )


    # --------------------------------------------------
    # Projects
    # --------------------------------------------------

    if projects:

        add_section_title(
            story,
            "Projects",
            styles
        )


        if isinstance(
            projects,
            list
        ):

            for item in projects:

                if isinstance(
                    item,
                    dict
                ):

                    title = clean_text(
                        item.get("title")
                    )

                    description = clean_text(
                        item.get(
                            "description"
                        )
                    )

                    technologies = item.get(
                        "technologies",
                        []
                    )


                    if title:

                        story.append(
                            Paragraph(
                                title,
                                styles[
                                    "HireLensItemTitle"
                                ]
                            )
                        )


                    if description:

                        story.append(
                            Paragraph(
                                description,
                                styles[
                                    "HireLensBody"
                                ]
                            )
                        )


                    if technologies:

                        if isinstance(
                            technologies,
                            list
                        ):

                            technology_text = (
                                "Technologies: "
                                + ", ".join(
                                    [
                                        clean_text(
                                            technology
                                        )
                                        for technology
                                        in technologies
                                    ]
                                )
                            )

                        else:

                            technology_text = (
                                "Technologies: "
                                + clean_text(
                                    technologies
                                )
                            )


                        story.append(
                            Paragraph(
                                technology_text,
                                styles[
                                    "HireLensSmallText"
                                ]
                            )
                        )


                else:

                    story.append(
                        Paragraph(
                            clean_text(item),
                            styles[
                                "HireLensBody"
                            ]
                        )
                    )


        else:

            story.append(
                Paragraph(
                    clean_text(projects),
                    styles[
                        "HireLensBody"
                    ]
                )
            )


    # --------------------------------------------------
    # Education
    # --------------------------------------------------

    if education:

        add_section_title(
            story,
            "Education",
            styles
        )


        if isinstance(
            education,
            list
        ):

            for item in education:

                if isinstance(
                    item,
                    dict
                ):

                    degree = clean_text(
                        item.get("degree")
                    )

                    institution = clean_text(
                        item.get(
                            "institution"
                        )
                    )

                    year = clean_text(
                        item.get("year")
                    )


                    parts = [
                        part
                        for part in [
                            degree,
                            institution
                        ]
                        if part
                    ]


                    education_line = (
                        " | ".join(parts)
                    )


                    if year:

                        education_line += (
                            f" ({year})"
                        )


                    if education_line:

                        story.append(
                            Paragraph(
                                education_line,
                                styles[
                                    "HireLensItemTitle"
                                ]
                            )
                        )


                else:

                    story.append(
                        Paragraph(
                            clean_text(item),
                            styles[
                                "HireLensBody"
                            ]
                        )
                    )


        else:

            story.append(
                Paragraph(
                    clean_text(education),
                    styles[
                        "HireLensBody"
                    ]
                )
            )


    # --------------------------------------------------
    # Certifications
    # --------------------------------------------------

    if certifications:

        add_section_title(
            story,
            "Certifications",
            styles
        )


        if isinstance(
            certifications,
            list
        ):

            add_bullet_list(
                story,
                certifications,
                styles
            )


        else:

            story.append(
                Paragraph(
                    clean_text(
                        certifications
                    ),
                    styles[
                        "HireLensBody"
                    ]
                )
            )


    # --------------------------------------------------
    # Build PDF
    # --------------------------------------------------

    document.build(
        story
    )

    pdf_buffer.seek(0)

    return pdf_buffer