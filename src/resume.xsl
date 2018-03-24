<?xml version="1.0" encoding="UTF-8"?>
<!--
Copyright (C) 2017 Jason Redding

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
-->
<xsl:stylesheet version="1.0"
								xmlns="http://www.w3.org/1999/xhtml"
								xmlns:h="http://www.w3.org/1999/xhtml"
								xmlns:r="http://witcraft.com/xsd/resume"
								xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
								exclude-result-prefixes="xsl h r">
	<xsl:preserve-space elements="*"/>
	<xsl:output method="xml" encoding="utf-8" indent="yes" omit-xml-declaration="yes"/>
	<xsl:param name="author-name" select="'1'"/>
	<xsl:param name="position-sort" select="'descending'"/>
	<xsl:param name="system-date">
		<xsl:if test="count(/r:resume[@last-modified]) > 0 and string-length(/r:resume/@last-modified) > 0">
			<xsl:value-of select="/r:resume/@last-modified"/>
		</xsl:if>
	</xsl:param>
	<xsl:param name="factor-relevance" select="true()"/>
	<xsl:param name="build-author-info" select="true()"/>
	<xsl:key name="level" match="/r:resume/r:meta/r:skill/r:levels/r:level" use="@value"/>
	<xsl:key name="category" match="/r:resume/r:meta/r:skill/r:categories/r:category" use="@value"/>
	<xsl:variable name="max-level">
		<xsl:for-each select="/r:resume/r:meta/r:skill/r:levels/r:level">
			<xsl:sort select="@value" data-type="number" order="descending"/>
			<xsl:if test="position() = 1">
				<xsl:value-of select="@value"/>
			</xsl:if>
		</xsl:for-each>
	</xsl:variable>
	<xsl:template match="/r:resume">
		<xsl:text disable-output-escaping="yes">&lt;!DOCTYPE html&gt;&#10;</xsl:text>
		<html>
			<head>
				<meta charset="utf-8"/>
				<meta http-equiv="X-UA-Compatible" content="IE=edge"/>
				<meta name="viewport" content="width=device-width, initial-scale=1"/>
				<title>resume.xml -> resume.xsl -> resume.xhtml</title>
				<link type="text/css" rel="stylesheet" href="/css/resume.css"/>
				<link type="text/css" rel="stylesheet" href="/css/resume-print.css" media="print"/>
			</head>
			<body>
				<div class="page-wrapper ui-helper-clearfix">
					<header class="header">
						<div class="author">
							<xsl:for-each select="r:author">
								<xsl:if test="$author-name = '1' or $author-name = 'yes' or $author-name = 'true' or $author-name = 'on' or boolean($author-name) = true()">
									<h1 class="author-name">
										<xsl:value-of select="normalize-space(@name)"/>
									</h1>
								</xsl:if>
								<xsl:if test="count(r:*) > 0">
									<div class="author-contact">
										<xsl:for-each select="r:*">
											<xsl:sort select="@order" data-type="number" order="ascending"/>
											<xsl:if test="position() > 1">
												<span class="separator"></span>
											</xsl:if>
											<a>
												<xsl:attribute name="class">
													<xsl:text>ui-link author-contact-info </xsl:text>
													<xsl:value-of select="concat('author-', local-name())"/>
												</xsl:attribute>
												<xsl:if test="not($build-author-info = '1' or $build-author-info = 'yes' or $build-author-info = 'true' or $build-author-info = 'on' or boolean($build-author-info) = true())">
													<xsl:choose>
														<xsl:when test="local-name() = 'address'">
															<xsl:attribute name="href">
																<xsl:text>//maps.apple.com/?</xsl:text>
																<xsl:value-of select="concat('address=', normalize-space())"/>
															</xsl:attribute>
															<xsl:attribute name="target">
																<xsl:text>_blank</xsl:text>
															</xsl:attribute>
															<address>
																<xsl:value-of select="normalize-space()"/>
															</address>
														</xsl:when>
														<xsl:when test="local-name() = 'email'">
															<xsl:attribute name="href">
																<xsl:value-of select="concat('mailto:', normalize-space())"/>
																<xsl:text>?subject=iResume</xsl:text>
															</xsl:attribute>
															<xsl:value-of select="normalize-space()"/>
														</xsl:when>
														<xsl:when test="local-name() = 'phone'">
															<xsl:attribute name="href">
																<xsl:value-of select="concat('tel:', translate(normalize-space(), '-', ''))"/>
															</xsl:attribute>
															<xsl:value-of select="normalize-space()"/>
														</xsl:when>
														<xsl:otherwise>
															<xsl:value-of select="normalize-space()"/>
														</xsl:otherwise>
													</xsl:choose>
												</xsl:if>
											</a>
										</xsl:for-each>
									</div>
								</xsl:if>
							</xsl:for-each>
						</div>
					</header>
					<xsl:choose>
						<xsl:when test="$build-author-info = '1' or $build-author-info = 'yes' or $build-author-info = 'true' or $build-author-info = 'on' or boolean($build-author-info) = true()">
							<xsl:for-each select="r:author[count(r:*) > 0]">
								<script type="javascript">
									<xsl:text>&#10;(function($, document, window) {&#10;</xsl:text>
							
									<xsl:text>var $authorContact = $('.header .author .author-contact');&#10;</xsl:text>
									<xsl:text>var authorNode = {};&#10;</xsl:text>
									<xsl:for-each select="r:*">
										<xsl:value-of select="concat(&quot;authorNode['&quot;, local-name(), &quot;']&quot;)"/>
										<xsl:text> = $authorContact.find('</xsl:text>
										<xsl:value-of select="concat('a.author-contact-info.author-', local-name())"/>
										<xsl:text>');&#10;</xsl:text>
										<xsl:choose>
											<xsl:when test="local-name() = 'address'">
												<xsl:value-of select="concat(&quot;authorNode['&quot;, local-name(), &quot;']&quot;)"/>
												<xsl:text>.attr({&#10;</xsl:text>
												<xsl:text>'href': '</xsl:text>
												<xsl:value-of select="concat('//maps.apple.com/?address=', normalize-space())"/>
												<xsl:text>',&#10;</xsl:text>
												<xsl:text>'target': '_blank'&#10;</xsl:text>
												<xsl:text>})&#10;</xsl:text>
												<xsl:text>.text('</xsl:text>
												<xsl:value-of select="normalize-space()"/>
												<xsl:text>');&#10;</xsl:text>
											</xsl:when>
											<xsl:when test="local-name() = 'email'">
												<xsl:value-of select="concat(&quot;authorNode['&quot;, local-name(), &quot;']&quot;)"/>
												<xsl:text>.attr({&#10;</xsl:text>
												<xsl:text>'href': '</xsl:text>
												<xsl:value-of select="concat('mailto:', normalize-space(), '?subject=iResume')"/>
												<xsl:text>'&#10;</xsl:text>
												<xsl:text>})&#10;</xsl:text>
												<xsl:text>.text('</xsl:text>
												<xsl:value-of select="normalize-space()"/>
												<xsl:text>');&#10;</xsl:text>
											</xsl:when>
											<xsl:when test="local-name() = 'phone'">
												<xsl:value-of select="concat(&quot;authorNode['&quot;, local-name(), &quot;']&quot;)"/>
												<xsl:text>.attr({&#10;</xsl:text>
												<xsl:text>'href': '</xsl:text>
												<xsl:value-of select="concat('tel:', translate(normalize-space(), '-._( )', ''))"/>
												<xsl:text>'&#10;</xsl:text>
												<xsl:text>})&#10;</xsl:text>
												<xsl:text>.text('</xsl:text>
												<xsl:value-of select="normalize-space()"/>
												<xsl:text>');&#10;</xsl:text>
											</xsl:when>
										</xsl:choose>
									</xsl:for-each>
									<xsl:text>})(jQuery, document, window);&#10;</xsl:text>
								</script>
							</xsl:for-each>
						</xsl:when>
					</xsl:choose>
					<main>
						<div class="main-inner">
							<xsl:for-each select="r:description">
								<h2 class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Description</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</h2>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:apply-templates mode="html"/>
								</div>
							</xsl:for-each>
							<xsl:for-each select="r:skills">
								<h2 class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Skills</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</h2>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<div class="skills">
										<xsl:choose>
											<xsl:when test="boolean($factor-relevance)">
												<xsl:variable name="relevant-skills" select="r:skill[r:categories/r:category/@value = 'relevant']"/>
												<xsl:variable name="more-skills" select="r:skill[not(r:categories/r:category/@value = 'relevant')]"/>
												<div class="skills-group-relevant">
													<div class="skills-group-label">
														<xsl:text>Relevant Skills:</xsl:text>
													</div>
													<xsl:for-each select="$relevant-skills">
														<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
														<xsl:sort select="concat(r:experience/r:since, '_', r:experience/r:until)" data-type="text" order="ascending"/>
														<xsl:if test="position() > 1">
															<xsl:text>, </xsl:text>
														</xsl:if>
														<xsl:call-template name="list-skill"/>
													</xsl:for-each>
												</div>
												<div class="skills-group-others">
													<div class="skills-group-label">
														<xsl:text>More Skills:</xsl:text>
													</div>
													<xsl:for-each select="$more-skills">
														<xsl:sort select="r:level/@value" data-type="number" order="descending"/>
														<xsl:sort select="concat(r:experience/r:since, '_', r:experience/r:until)" data-type="text" order="ascending"/>
														<xsl:if test="position() > 1">
															<xsl:text>, </xsl:text>
														</xsl:if>
														<xsl:call-template name="list-skill"/>
													</xsl:for-each>
												</div>
											</xsl:when>
											<xsl:otherwise>
												<xsl:for-each select="r:skill">
													<xsl:sort select="r:name" order="ascending"/>
													<xsl:if test="position() > 1">
														<xsl:text>, </xsl:text>
													</xsl:if>
													<xsl:call-template name="list-skill"/>
												</xsl:for-each>
											</xsl:otherwise>
										</xsl:choose>
									</div>
								</div>
							</xsl:for-each>
							<xsl:for-each select="r:certifications[count(r:certificate) > 0]">
								<h2 class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Certifications</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</h2>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<div class="certifications">
										<xsl:for-each select="r:certificate">
											<xsl:if test="position() > 1">
												<xsl:text>, </xsl:text>
											</xsl:if>
											<span class="certificate">
												<xsl:attribute name="data-name">
													<xsl:value-of select="normalize-space(@name)"/>
												</xsl:attribute>
												<xsl:attribute name="data-full-name">
													<xsl:value-of select="normalize-space()"/>
												</xsl:attribute>
												<xsl:attribute name="data-issuer">
													<xsl:value-of select="normalize-space(@issuer)"/>
												</xsl:attribute>
												<xsl:attribute name="title">
													<xsl:value-of select="normalize-space()"/>
												</xsl:attribute>
												<span class="text">
													<xsl:value-of select="normalize-space(@name)"/>
												</span>
											</span>
										</xsl:for-each>
									</div>
								</div>
							</xsl:for-each>
							<xsl:for-each select="r:employers">
								<h2 class="section-heading">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:choose>
										<xsl:when test="string-length(normalize-space(@title)) > 0">
											<xsl:value-of select="@title"/>
										</xsl:when>
										<xsl:otherwise>
											<xsl:text>Employers</xsl:text>
										</xsl:otherwise>
									</xsl:choose>
								</h2>
								<div class="section-content">
									<xsl:attribute name="data-section">
										<xsl:value-of select="local-name()"/>
									</xsl:attribute>
									<xsl:for-each select="r:employer">
										<h3 class="employer-title">
											<xsl:value-of select="normalize-space(r:title)"/>
										</h3>
										<xsl:for-each select="r:positions/r:position">
											<xsl:sort select="r:timeline/r:start-date" data-type="text" order="{$position-sort}"/>
											<div class="position-container">
												<h4 class="position-title">
													<xsl:value-of select="normalize-space(r:title)"/>
												</h4>
												<xsl:for-each select="r:timeline">
													<div class="timeline-container">
														<span class="timeline-start">
															<xsl:for-each select="r:start-date">
																<xsl:call-template name="date-eval">
																	<xsl:with-param name="symbolic" select="@symbolic"/>
																	<xsl:with-param name="truncate-to" select="@truncate-to"/>
																	<xsl:with-param name="format" select="@format"/>
																</xsl:call-template>
															</xsl:for-each>
														</span>
														<xsl:text> - </xsl:text>
														<span class="timeline-end">
															<xsl:choose>
																<xsl:when test="count(r:end-date) > 0">
																	<xsl:for-each select="r:end-date">
																		<xsl:call-template name="date-eval">
																			<xsl:with-param name="symbolic" select="@symbolic"/>
																			<xsl:with-param name="truncate-to" select="@truncate-to"/>
																			<xsl:with-param name="format" select="@format"/>
																		</xsl:call-template>
																	</xsl:for-each>
																</xsl:when>
																<xsl:otherwise>
																	<xsl:text>Present</xsl:text>
																</xsl:otherwise>
															</xsl:choose>
														</span>
													</div>
												</xsl:for-each>
												<xsl:for-each select="r:projects">
													<!--<div class="projects-selector">
														<select id="project-selector" onchange="window.location = '#' + this[this.selectedIndex].value;">
															<option value="">- Jump to Project -</option>
															<xsl:for-each select="r:project">
																<xsl:sort select="r:title" data-type="text" order="ascending"/>
																<option>
																	<xsl:attribute name="value">
																		<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
																	</xsl:attribute>
																	<xsl:value-of select="normalize-space(r:title)"/>
																</option>
															</xsl:for-each>
														</select>
													</div>-->
													<div class="projects-container" data-role="collapsibleset" data-inset="false">
														<xsl:for-each select="r:project[not(@hidden='true' or @hidden='1' or @hidden='yes' or @hidden='on')]">
															<div class="project-item" data-role="collapsible">
																<h5 class="project-title">
																	<!--<a>
																		<xsl:attribute name="name">
																			<xsl:value-of select="translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz')"/>
																		</xsl:attribute>
																		<xsl:attribute name="href">
																			<xsl:value-of select="concat('#', translate(normalize-space(r:title), ' ABCDEFGHIJKLMNOPQRSTUVWXYZ', '-abcdefghijklmnopqrstuvwxyz'))"/>
																		</xsl:attribute>
																	</a>-->
																	<span class="project-title-text">
																		<xsl:value-of select="normalize-space(r:title)"/>
																	</span>
																</h5>
																<div class="project-description">
																	<xsl:if test="string-length(normalize-space(r:link)) > 0">
																		<span class="project-link">
																			<span class="project-link-label">Project Link:</span>
																			<xsl:text> </xsl:text>
																			<a href="{normalize-space(r:link)}" target="_blank" class="project-link">
																				<xsl:value-of select="normalize-space(r:link)"/>
																			</a>
																		</span>
																	</xsl:if>
																	<xsl:for-each select="r:description">
																		<xsl:apply-templates mode="html"/>
																	</xsl:for-each>
																</div>
															</div>
														</xsl:for-each>
													</div>
												</xsl:for-each>
												<xsl:for-each select="r:description">
													<div class="position-description">
														<xsl:apply-templates mode="html"/>
													</div>
												</xsl:for-each>
											</div>
										</xsl:for-each>
									</xsl:for-each>
								</div>
							</xsl:for-each>
						</div>
					</main>
				</div>
			</body>
		</html>
	</xsl:template>

	<xsl:template name="list-skill" match="r:skill">
		<xsl:param name="skill" select="."/>
		<xsl:param name="skill-text" select="$skill/r:name"/>
		<xsl:variable name="experience-ongoing" select="string-length(normalize-space($skill/r:experience/r:until)) = 0"/>
		<xsl:variable name="experience-since-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date" select="normalize-space($skill/r:experience/r:since)"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-until-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="$experience-ongoing">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="normalize-space($skill/r:experience/r:until)"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="experience-years">
			<xsl:call-template name="get-duration">
				<xsl:with-param name="from-year" select="$experience-since-year"/>
				<xsl:with-param name="to-year" select="$experience-until-year"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="skill-level" select="$skill/r:level/@value"/>
		<xsl:variable name="meta-skill-level" select="key('level', floor($skill-level))"/>
		<xsl:variable name="skill-level-preposition">
			<xsl:choose>
				<xsl:when test="count($meta-skill-level[@preposition]) > 0">
					<xsl:value-of select="normalize-space($meta-skill-level/@preposition)"/>
				</xsl:when>
				<xsl:when test="count(/r:resume/r:meta/r:skill/r:levels[@preposition]) > 0">
					<xsl:value-of select="normalize-space(/r:resume/r:meta/r:skill/r:levels/@preposition)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:text>at</xsl:text>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<span class="skill">
			<xsl:attribute name="class">
				<xsl:text>skill skill-name</xsl:text>
				<xsl:value-of select="concat(' base-level-', floor($skill-level))"/>
				<xsl:if test="not($skill-level = floor($skill-level))">
					<xsl:value-of select="concat(' level-', $skill-level)"/>
				</xsl:if>
				<xsl:value-of select="concat(' experience-years-', $experience-years)"/>
				<xsl:for-each select="$skill/r:categories/r:category">
					<xsl:value-of select="concat(' category-', @value)"/>
				</xsl:for-each>
			</xsl:attribute>
			<xsl:attribute name="title">
				<xsl:value-of select="normalize-space($meta-skill-level)"/>
				<xsl:text> </xsl:text>
				<xsl:value-of select="$skill-level-preposition"/>
				<xsl:text> </xsl:text>
				<xsl:value-of select="normalize-space($skill/r:name)"/>
				<xsl:text> with </xsl:text>
				<xsl:value-of select="$experience-years"/>
				<xsl:text> year</xsl:text>
				<xsl:if test="not(number($experience-years) = 1)">
					<xsl:text>s</xsl:text>
				</xsl:if>
				<xsl:text> of experience</xsl:text>
				<!--<xsl:text>&#10;&#10;</xsl:text>
			<xsl:choose>
				<xsl:when test="count(r:categories/r:category) = 1">
					<xsl:text>Category: </xsl:text>
				</xsl:when>
				<xsl:when test="count(r:categories/r:category) > 1">
					<xsl:text>Categories: </xsl:text>
				</xsl:when>
			</xsl:choose>
			<xsl:for-each select="r:categories/r:category">
				<xsl:sort select="normalize-space(key('category', @value))" data-type="text" order="ascending"/>
				<xsl:if test="position() > 1">
					<xsl:text>, </xsl:text>
				</xsl:if>
				<xsl:value-of select="normalize-space(key('category', @value))"/>
				</xsl:for-each>-->
			</xsl:attribute>
			<xsl:attribute name="data-level-value">
				<xsl:value-of select="normalize-space($skill-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-level">
				<xsl:value-of select="normalize-space(key('level', floor($skill-level)))"/>
			</xsl:attribute>
			<xsl:attribute name="data-level-percentage">
				<xsl:value-of select="($skill-level div $max-level)"/>
			</xsl:attribute>
			<xsl:attribute name="data-since">
				<xsl:value-of select="$experience-since-year"/> 
			</xsl:attribute>
			<xsl:attribute name="data-until">
				<xsl:value-of select="$experience-until-year"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-years">
				<xsl:value-of select="$experience-years"/>
			</xsl:attribute>
			<xsl:attribute name="data-experience-duration">
				<xsl:value-of select="concat('P', $experience-years, 'Y')"/>
			</xsl:attribute>
			<xsl:attribute name="tabindex">
				<xsl:value-of select="0"/>
			</xsl:attribute>
			<span class="text">
				<!--<xsl:value-of select="normalize-space($skill/r:name)"/>-->
				<xsl:value-of select="$skill-text"/>
			</span>
		</span>
	</xsl:template>

	<xsl:template name="handle-html" match="h:*|text()" mode="html">
		<xsl:if test="count(self::*) > 0">
			<xsl:element name="{local-name()}">
				<xsl:apply-templates mode="html" select="@*"/>
				<xsl:apply-templates mode="html"/>
			</xsl:element>
		</xsl:if>
		<xsl:if test="count(self::text()) > 0">
			<xsl:call-template name="handle-text">
				<xsl:with-param name="text" select="."/>
			</xsl:call-template>
		</xsl:if>
	</xsl:template>

	<xsl:template name="get-duration" match="r:duration" mode="html">
		<xsl:param name="from-year">
			<xsl:if test="count(self::r:duration[@from]) > 0">
				<xsl:value-of select="normalize-space(@from)"/>
			</xsl:if>
		</xsl:param>
		<xsl:param name="to-year">
			<xsl:if test="count(self::r:duration[@to]) > 0">
				<xsl:value-of select="normalize-space(@to)"/>
			</xsl:if>
		</xsl:param>
		<xsl:variable name="start-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($from-year)) > 0">
							<xsl:value-of select="normalize-space($from-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="end-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="string-length(normalize-space($to-year)) > 0">
							<xsl:value-of select="normalize-space($to-year)"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
						<xsl:when test="string-length(/r:resume/@last-modified) > 0">
							<xsl:value-of select="/r:resume/@last-modified"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="(number($end-year) - number($start-year)) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="(number($end-year) - number($start-year))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>

		<xsl:choose>
			<xsl:when test="string-length($start-year) > 0 and string-length($end-year) > 0">
				<xsl:choose>
					<xsl:when test="count(self::r:duration) > 0">
						<xsl:element name="time">
							<xsl:attribute name="datetime">
								<xsl:text>P</xsl:text>
								<xsl:value-of select="concat($duration, 'Y')"/>
							</xsl:attribute>
							<xsl:attribute name="title">
								<xsl:value-of select="concat('Since ', $start-year)"/>
							</xsl:attribute>
							<xsl:attribute name="tabindex">
								<xsl:value-of select="0"/>
							</xsl:attribute>
							<xsl:value-of select="$duration"/>
							<xsl:value-of select="concat(' ', normalize-space(@unit))"/>
						</xsl:element>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$duration"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="normalize-space(text())"/>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<!--<xsl:template name="duration" match="r:duration" mode="html">
		<xsl:variable name="from-year">
			<xsl:choose>
				<xsl:when test="count(self::r:duration[@from]) > 0">
					<xsl:call-template name="date-eval">
						<xsl:with-param name="truncate-to" select="'year'"/>
						<xsl:with-param name="date" select="@from"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="to-year">
			<xsl:call-template name="date-eval">
				<xsl:with-param name="truncate-to" select="'year'"/>
				<xsl:with-param name="date">
					<xsl:choose>
						<xsl:when test="count(self::r:duration[@to]) > 0">
							<xsl:value-of select="@to"/>
						</xsl:when>
						<xsl:when test="string-length($system-date) > 0">
							<xsl:value-of select="$system-date"/>
						</xsl:when>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="duration">
			<xsl:choose>
				<xsl:when test="(number($to-year) - number($from-year)) = 0">
					<xsl:value-of select="1"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="(number($to-year) - number($from-year))"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="string-length($from-year) > 0 and string-length($to-year) > 0">
				<xsl:element name="time">
					<xsl:attribute name="datetime">
						<xsl:text>P</xsl:text>
						<xsl:value-of select="concat($duration, 'Y')"/>
					</xsl:attribute>
					<xsl:attribute name="title">
						<xsl:value-of select="concat('Since ', $from-year)"/>
					</xsl:attribute>
					<xsl:value-of select="concat(' ', $duration, ' ', normalize-space(@unit), ' ')"/>
				</xsl:element>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using </xsl:text>
					<xsl:value-of select="concat('(', $to-year, ' - ', $from-year, ')')"/>
				</xsl:message>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="concat(' ', normalize-space(text()), ' ')"/>
				<xsl:message terminate="no">
					<xsl:text disable-output-escaping="yes">&lt;duration&gt; using fallback value: </xsl:text>
					<xsl:value-of select="concat('&quot;', normalize-space(text()), '&quot;')"/>
				</xsl:message>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>-->

	<xsl:template match="@*" mode="html">
		<xsl:attribute name="{local-name()}">
			<xsl:value-of select="."/>
		</xsl:attribute>
	</xsl:template>

	<xsl:template name="handle-text">
		<xsl:param name="text" select="''"/>
		<xsl:choose>
			<xsl:when test="string-length($text) > 0 and string-length(normalize-space($text)) = 0">
				<xsl:text> </xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$text"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="date-eval" match="r:start-date | r:end-date">
		<xsl:param name="date" select="."/>
		<xsl:param name="format" select="@format"/>
		<xsl:param name="symbolic">
			<xsl:choose>
				<xsl:when test="$date = 'now' or $date = 'present'">
					<xsl:value-of select="'present'"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="false()"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:param>
		<xsl:param name="truncate-to" select="''"/>
		<xsl:variable name="value" select="normalize-space($date)"/>
		<xsl:choose>
			<xsl:when test="$symbolic = 'present'">
				<xsl:text>Present</xsl:text>
			</xsl:when>
			<xsl:otherwise>
				<xsl:variable name="truncated-date">
					<xsl:choose>
						<xsl:when test="$truncate-to = 'year'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="$value"/>
								<xsl:with-param name="token" select="'-'"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'month'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="$value"/>
								<xsl:with-param name="token" select="'-'"/>
								<xsl:with-param name="skip-count" select="1"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'day'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="substring-before($value, 'T')"/>
								<xsl:with-param name="token" select="'-'"/>
								<xsl:with-param name="skip-count" select="2"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'hour'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="$value"/>
								<xsl:with-param name="token" select="'T'"/>
							</xsl:call-template>
							<xsl:if test="contains($value, 'T')">
								<xsl:text>T</xsl:text>
							</xsl:if>
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="substring-after($value, 'T')"/>
								<xsl:with-param name="token" select="':'"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'minute'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="$value"/>
								<xsl:with-param name="token" select="'T'"/>
							</xsl:call-template>
							<xsl:if test="contains($value, 'T')">
								<xsl:text>T</xsl:text>
							</xsl:if>
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="substring-after($value, 'T')"/>
								<xsl:with-param name="token" select="':'"/>
								<xsl:with-param name="skip-count" select="1"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:when test="$truncate-to = 'second'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="$value"/>
								<xsl:with-param name="token" select="'T'"/>
							</xsl:call-template>
							<xsl:if test="contains($value, 'T')">
								<xsl:text>T</xsl:text>
							</xsl:if>
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="substring-after($value, 'T')"/>
								<xsl:with-param name="token" select="':'"/>
								<xsl:with-param name="skip-count" select="2"/>
							</xsl:call-template>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$value"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:choose>
					<xsl:when test="string-length($format) > 0">
						<xsl:call-template name="date-format">
							<xsl:with-param name="date" select="$truncated-date"/>
							<xsl:with-param name="format" select="$format"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$truncated-date"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="date-format">
		<xsl:param name="date" select="."/>
		<xsl:param name="format" select="'M/d/yyyy'"/>
		<xsl:variable name="value" select="normalize-space($date)"/>
		<xsl:variable name="year-test">
			<xsl:call-template name="grab-until">
				<xsl:with-param name="text" select="$value"/>
				<xsl:with-param name="token" select="'-'"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="month-test">
			<xsl:call-template name="grab-until">
				<xsl:with-param name="text" select="$value"/>
				<xsl:with-param name="token" select="'-'"/>
				<xsl:with-param name="skip-count" select="1"/>
				<xsl:with-param name="include-skipped" select="false()"/>
			</xsl:call-template>
		</xsl:variable>
		<xsl:variable name="day-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="substring-before($value, 'T')"/>
						<xsl:with-param name="token" select="'-'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
				<xsl:otherwise>
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="$value"/>
						<xsl:with-param name="token" select="'-'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="hour-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="substring-after($value, 'T')"/>
						<xsl:with-param name="token" select="':'"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="minute-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="substring-after($value, 'T')"/>
						<xsl:with-param name="token" select="':'"/>
						<xsl:with-param name="skip-count" select="1"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="second-test">
			<xsl:choose>
				<xsl:when test="contains($value, 'T')">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="substring-after($value, 'T')"/>
						<xsl:with-param name="token" select="':'"/>
						<xsl:with-param name="skip-count" select="2"/>
						<xsl:with-param name="include-skipped" select="false()"/>
					</xsl:call-template>
				</xsl:when>
			</xsl:choose>
		</xsl:variable>
		
		<xsl:variable name="year">
			<xsl:value-of select="number($year-test)"/>
		</xsl:variable>
		<xsl:variable name="month">
			<xsl:choose>
				<xsl:when test="string-length($month-test) > 0">
					<xsl:value-of select="number($month-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="day">
			<xsl:choose>
				<xsl:when test="string-length($day-test) > 0">
					<xsl:value-of select="number($day-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="1"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="hour">
			<xsl:choose>
				<xsl:when test="string-length($hour-test) > 0">
					<xsl:value-of select="number($hour-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="minute">
			<xsl:choose>
				<xsl:when test="string-length($minute-test) > 0">
					<xsl:value-of select="number($minute-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="second">
			<xsl:choose>
				<xsl:when test="string-length($second-test) > 0">
					<xsl:value-of select="number($second-test)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="0"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		
		<xsl:call-template name="eval-date-format">
			<xsl:with-param name="date-year" select="$year"/>
			<xsl:with-param name="date-month" select="$month"/>
			<xsl:with-param name="date-day" select="$day"/>
			<xsl:with-param name="date-hour" select="$hour"/>
			<xsl:with-param name="date-minute" select="$minute"/>
			<xsl:with-param name="date-second" select="$second"/>
			<xsl:with-param name="format" select="$format"/>
		</xsl:call-template>
	</xsl:template>
	
	<xsl:template name="eval-date-format">
		<xsl:param name="date-year" select="''"/>
		<xsl:param name="date-month" select="''"/>
		<xsl:param name="date-day" select="''"/>
		<xsl:param name="date-hour" select="''"/>
		<xsl:param name="date-minute" select="''"/>
		<xsl:param name="date-second" select="''"/>
		<xsl:param name="format" select="''"/>
		<xsl:param name="position" select="1"/>
		<xsl:choose>
			<xsl:when test="substring($format, $position, 1) = &quot;'&quot;">
				<xsl:variable name="literal">
					<xsl:call-template name="grab-until">
						<xsl:with-param name="text" select="substring($format, $position + 1)"/>
						<xsl:with-param name="token" select="&quot;'&quot;"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:value-of select="$literal"/>
				<xsl:call-template name="eval-date-format">
					<xsl:with-param name="date-year" select="$date-year"/>
					<xsl:with-param name="date-month" select="$date-month"/>
					<xsl:with-param name="date-day" select="$date-day"/>
					<xsl:with-param name="date-hour" select="$date-hour"/>
					<xsl:with-param name="date-minute" select="$date-minute"/>
					<xsl:with-param name="date-second" select="$date-second"/>
					<xsl:with-param name="format" select="$format"/>
					<xsl:with-param name="position" select="$position + string-length($literal) + 2"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$position &lt;= string-length($format)">
				<xsl:variable name="mask">
					<xsl:call-template name="grab-same">
						<xsl:with-param name="text" select="$format"/>
						<xsl:with-param name="position" select="$position"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:variable name="token" select="substring($mask, 1, 1)"/>
				<xsl:variable name="date-part">
					<xsl:choose>
						<xsl:when test="$token = 'y'">
							<xsl:value-of select="$date-year"/>
						</xsl:when>
						<xsl:when test="$token = 'M'">
							<xsl:value-of select="$date-month"/>
						</xsl:when>
						<xsl:when test="$token = 'd'">
							<xsl:value-of select="$date-day"/>
						</xsl:when>
						<xsl:when test="$token = 'H'">
							<xsl:value-of select="$date-hour"/>
						</xsl:when>
						<xsl:when test="$token = 'h'">
							<xsl:choose>
								<xsl:when test="$date-hour = 0">
									<xsl:value-of select="12"/>
								</xsl:when>
								<xsl:when test="$date-hour > 12">
									<xsl:value-of select="$date-hour - 12"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$date-hour"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
						<xsl:when test="$token = 'm'">
							<xsl:value-of select="$date-minute"/>
						</xsl:when>
						<xsl:when test="$token = 's'">
							<xsl:value-of select="$date-second"/>
						</xsl:when>
						<xsl:when test="$token = 'a'">
							<xsl:choose>
								<xsl:when test="$date-hour &lt; 12">
									<xsl:value-of select="'AM'"/>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="'PM'"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>
				
				<xsl:variable name="modifier">
					<xsl:choose>
						<xsl:when test="substring($format, $position + string-length($mask), 1) = '{'">
							<xsl:call-template name="grab-until">
								<xsl:with-param name="text" select="substring($format, $position + string-length($mask))"/>
								<xsl:with-param name="token" select="'}'"/>
							</xsl:call-template>
							<xsl:value-of select="'}'"/>
						</xsl:when>
					</xsl:choose>
				</xsl:variable>
				
				<xsl:choose>
					<xsl:when test="string-length(translate($token, 'yMdHhmsa', '')) = 0">
						<xsl:variable name="format-date-part-result">
							<xsl:call-template name="format-date-part">
								<xsl:with-param name="date-part" select="$date-part"/>
								<xsl:with-param name="format" select="$mask"/>
							</xsl:call-template>
						</xsl:variable>
						<xsl:variable name="final-result">
							<xsl:choose>
								<xsl:when test="string-length($modifier) > 0">
									<xsl:call-template name="eval-modifier">
										<xsl:with-param name="input" select="$format-date-part-result"/>
										<xsl:with-param name="modifier" select="$modifier"/>
									</xsl:call-template>
								</xsl:when>
								<xsl:otherwise>
									<xsl:value-of select="$format-date-part-result"/>
								</xsl:otherwise>
							</xsl:choose>
						</xsl:variable>
						<xsl:value-of select="$final-result"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$mask"/>
					</xsl:otherwise>
				</xsl:choose>
				<xsl:call-template name="eval-date-format">
					<xsl:with-param name="date-year" select="$date-year"/>
					<xsl:with-param name="date-month" select="$date-month"/>
					<xsl:with-param name="date-day" select="$date-day"/>
					<xsl:with-param name="date-hour" select="$date-hour"/>
					<xsl:with-param name="date-minute" select="$date-minute"/>
					<xsl:with-param name="date-second" select="$date-second"/>
					<xsl:with-param name="format" select="$format"/>
					<xsl:with-param name="position" select="$position + string-length($mask) + string-length($modifier)"/>
				</xsl:call-template>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="eval-modifier">
		<xsl:param name="input" select="''"/>
		<xsl:param name="modifier" select="''"/>
		<xsl:choose>
			<xsl:when test="$modifier = '{st}' or $modifier = '{nd}' or $modifier = '{rd}' or $modifier = '{th}'">
				<xsl:variable name="last-digit" select="number(substring($input, string-length($input)))"/>
				<xsl:variable name="last-two-digits">
					<xsl:choose>
						<xsl:when test="string-length($input) > 1">
							<xsl:value-of select="number(substring($input, string-length($input) - 1))"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$last-digit"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:variable>
				<xsl:value-of select="$input"/>
				<xsl:choose>
					<xsl:when test="$last-two-digits > 10 and $last-two-digits &lt; 20">
						<xsl:value-of select="'th'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 1">
						<xsl:value-of select="'st'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 2">
						<xsl:value-of select="'nd'"/>
					</xsl:when>
					<xsl:when test="$last-digit = 3">
						<xsl:value-of select="'rd'"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="'th'"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$modifier = '{upper}' or $modifier = '{uppercase}'">
				<xsl:value-of select="translate($input, 'abcdefghijklmnopqrstuvwxyz', 'ABCDEFGHIJKLMNOPQRSTUVWXYZ')"/>
			</xsl:when>
			<xsl:when test="$modifier = '{lower}' or $modifier = '{lowercase}'">
				<xsl:value-of select="translate($input, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')"/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="format-date-part">
		<xsl:param name="date-part" select="''"/>
		<xsl:param name="format" select="''"/>
		<xsl:variable name="value" select="number(normalize-space($date-part))"/>
		<xsl:variable name="token" select="substring($format, 1, 1)"/>
		<xsl:choose>
			<xsl:when test="$token = 'y'">
				<xsl:choose>
					<xsl:when test="string-length($format) &lt; 4">
						<xsl:value-of select="substring($value, string-length($value) - string-length($format) + 1)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="zero-pad">
							<xsl:with-param name="value" select="$value"/>
							<xsl:with-param name="size" select="string-length($format)"/>
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$token = 'M'">
				<xsl:variable name="value-name">
					<xsl:call-template name="get-month-name">
						<xsl:with-param name="value" select="$value"/>
					</xsl:call-template>
				</xsl:variable>
				<xsl:choose>
					<xsl:when test="string-length($format) &lt; 3">
						<xsl:call-template name="zero-pad">
							<xsl:with-param name="value" select="$value"/>
							<xsl:with-param name="size" select="string-length($format)"/>
						</xsl:call-template>
					</xsl:when>
					<xsl:when test="string-length($format) = 3">
						<xsl:value-of select="substring($value-name, 1, string-length($format))"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$value-name"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$token = 'd'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value" select="$value"/>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'H'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value" select="$value"/>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'h'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value" select="$value"/>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 'm'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value" select="$value"/>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:when test="$token = 's'">
				<xsl:call-template name="zero-pad">
					<xsl:with-param name="value" select="$value"/>
					<xsl:with-param name="size" select="string-length($format)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$date-part"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="get-month-name">
		<xsl:param name="value" select="."/>
		<xsl:variable name="month" select="number(normalize-space($value))"/>
		<xsl:choose>
			<xsl:when test="$month = 1">
				<xsl:value-of select="'January'"/>
			</xsl:when>
			<xsl:when test="$month = 2">
				<xsl:value-of select="'February'"/>
			</xsl:when>
			<xsl:when test="$month = 3">
				<xsl:value-of select="'March'"/>
			</xsl:when>
			<xsl:when test="$month = 4">
				<xsl:value-of select="'April'"/>
			</xsl:when>
			<xsl:when test="$month = 5">
				<xsl:value-of select="'May'"/>
			</xsl:when>
			<xsl:when test="$month = 6">
				<xsl:value-of select="'June'"/>
			</xsl:when>
			<xsl:when test="$month = 7">
				<xsl:value-of select="'July'"/>
			</xsl:when>
			<xsl:when test="$month = 8">
				<xsl:value-of select="'August'"/>
			</xsl:when>
			<xsl:when test="$month = 9">
				<xsl:value-of select="'September'"/>
			</xsl:when>
			<xsl:when test="$month = 10">
				<xsl:value-of select="'October'"/>
			</xsl:when>
			<xsl:when test="$month = 11">
				<xsl:value-of select="'November'"/>
			</xsl:when>
			<xsl:when test="$month = 12">
				<xsl:value-of select="'December'"/>
			</xsl:when>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="zero-pad">
		<xsl:param name="value" select="."/>
		<xsl:param name="size" select="2"/>
		<xsl:variable name="number" select="number(normalize-space($value))"/>
		<xsl:call-template name="pad-left">
			<xsl:with-param name="char" select="'0'"/>
			<xsl:with-param name="value" select="$number"/>
			<xsl:with-param name="size" select="$size"/>
		</xsl:call-template>
	</xsl:template>
	
	<xsl:template name="pad-left">
		<xsl:param name="value" select="."/>
		<xsl:param name="char" select="' '"/>
		<xsl:param name="size" select="0"/>
		<xsl:choose>
			<xsl:when test="string-length($value) &lt; $size">
				<xsl:call-template name="pad-left">
					<xsl:with-param name="char" select="$char"/>
					<xsl:with-param name="value" select="concat($char, $value)"/>
					<xsl:with-param name="size" select="$size"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$value"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="pad-right">
		<xsl:param name="value" select="."/>
		<xsl:param name="char" select="' '"/>
		<xsl:param name="size" select="0"/>
		<xsl:choose>
			<xsl:when test="string-length($value) &lt; $size">
				<xsl:call-template name="pad-right">
					<xsl:with-param name="char" select="$char"/>
					<xsl:with-param name="value" select="concat($value, $char)"/>
					<xsl:with-param name="size" select="$size"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$value"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	
	<xsl:template name="grab-same">
		<xsl:param name="text" select="."/>
		<xsl:param name="position" select="1"/>
		<xsl:param name="output" select="''"/>
		<xsl:variable name="char" select="substring($text, $position, 1)"/>
		<xsl:choose>
			<xsl:when test="$position &lt;= string-length($text)">
				<xsl:choose>
					<xsl:when test="string-length($output) > 0">
						<xsl:choose>
							<xsl:when test="substring($output, 1, 1) = $char">
								<xsl:call-template name="grab-same">
									<xsl:with-param name="text" select="$text"/>
									<xsl:with-param name="position" select="$position + 1"/>
									<xsl:with-param name="output" select="concat($output, $char)"/>
								</xsl:call-template>
							</xsl:when>
							<xsl:otherwise>
								<xsl:value-of select="$output"/>
							</xsl:otherwise>
						</xsl:choose>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="grab-same">
							<xsl:with-param name="text" select="$text"/>
							<xsl:with-param name="position" select="$position + 1"/>
							<xsl:with-param name="output" select="$char"/>
						</xsl:call-template>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$output"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="grab-until">
		<xsl:param name="text" select="."/>
		<xsl:param name="token" select="','"/>
		<xsl:param name="skip-count" select="0"/>
		<xsl:param name="index" select="0"/>
		<xsl:param name="include-skipped" select="true()"/>
		<xsl:choose>
			<xsl:when test="$index = $skip-count">
				<xsl:choose>
					<xsl:when test="contains($text, $token)">
						<xsl:value-of select="substring-before($text, $token)"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$text"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:when>
			<xsl:when test="$index > $skip-count"/>
			<xsl:otherwise>
				<xsl:if test="boolean($include-skipped)">
					<xsl:choose>
						<xsl:when test="contains($text, $token)">
							<xsl:value-of select="substring-before($text, $token)"/>
							<xsl:value-of select="$token"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:value-of select="$text"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:if>
				<xsl:call-template name="grab-until">
					<xsl:with-param name="text" select="substring-after($text, $token)"/>
					<xsl:with-param name="token" select="$token"/>
					<xsl:with-param name="skip-count" select="$skip-count"/>
					<xsl:with-param name="index" select="$index + 1"/>
					<xsl:with-param name="include-skipped" select="$include-skipped"/>
				</xsl:call-template>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>

	<xsl:template name="skill-ref" match="r:skill" mode="html">
		<xsl:param name="skill-ref" select="."/>
		<xsl:variable name="skill-name">
			<xsl:choose>
				<xsl:when test="count($skill-ref/self::*[@name]) > 0">
					<xsl:value-of select="normalize-space($skill-ref/@name)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="normalize-space($skill-ref)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:variable name="ref-name" select="translate(normalize-space($skill-name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-')"/>
		<xsl:variable name="ref" select="/r:resume/r:skills/r:skill[translate(normalize-space(r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = $ref-name]"/>
		<xsl:variable name="skill-text">
			<xsl:choose>
				<xsl:when test="count($skill-ref/self::*[@name]) = 0 and translate(normalize-space($ref/r:name), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ ', 'abcdefghijklmnopqrstuvwxyz-') = $ref-name">
					<xsl:value-of select="normalize-space($ref/r:name)"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="normalize-space($skill-ref)"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:variable>
		<xsl:choose>
			<xsl:when test="count($ref) > 0">
				<xsl:call-template name="list-skill">
					<xsl:with-param name="skill" select="$ref"/>
					<xsl:with-param name="skill-text" select="normalize-space($skill-text)"/>
				</xsl:call-template>
			</xsl:when>
			<xsl:otherwise>
				<xsl:element name="span">
					<xsl:attribute name="class">
						<xsl:text>skill-reference skill-reference-error</xsl:text>
					</xsl:attribute>
					<xsl:attribute name="data-skill-reference">
						<xsl:value-of select="$ref-name"/>
					</xsl:attribute>
					<xsl:value-of select="normalize-space($skill-text)"/>
				</xsl:element>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
</xsl:stylesheet>
